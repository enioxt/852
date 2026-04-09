/**
 * Output Gate — ATRiAN v2
 *
 * Controls token flow to client based on validation results.
 */

import { StreamingValidator, ValidationResult } from './streaming-validator';
import { RollingBuffer } from './rolling-buffer';

export type GateStatus = 'open' | 'paused' | 'closed' | 'warning';

export interface GateDecision {
  status: GateStatus;
  output: string | null; // null = block, string = allow (possibly modified)
  violations: ValidationResult[];
  metadata: {
    bufferSize: number;
    totalViolations: number;
    blockingViolations: number;
  };
}

export class OutputGate {
  private validator: StreamingValidator;
  private buffer: RollingBuffer;
  private status: GateStatus = 'open';
  private violationCount: number = 0;
  private blockingCount: number = 0;

  constructor(options: {
    validator: StreamingValidator;
    bufferSize: number;
  }) {
    this.validator = options.validator;
    this.buffer = new RollingBuffer({ maxTokens: options.bufferSize });
  }

  /**
   * Process chunk through gate
   */
  async processChunk(chunk: string): Promise<GateDecision> {
    // Add to buffer
    this.buffer.add(chunk);

    // Get buffer context for validation
    const context = this.buffer.getRecentContext();

    // Validate
    const violations = await this.validator.validateChunk(context);

    // Categorize violations
    const blocking = violations.filter(v => v.severity === 'block');
    const warnings = violations.filter(v => v.severity === 'warn');
    const logs = violations.filter(v => v.severity === 'log');

    this.violationCount += violations.length;
    this.blockingCount += blocking.length;

    // Determine action
    let decision: GateDecision;

    if (blocking.length > 0) {
      // Handle blocking violations
      const abortViolation = blocking.find(v => v.action === 'abort');

      if (abortViolation) {
        this.status = 'closed';
        decision = {
          status: 'closed',
          output: null,
          violations,
          metadata: {
            bufferSize: this.buffer.getState().tokenCount,
            totalViolations: this.violationCount,
            blockingViolations: this.blockingCount,
          },
        };
      } else {
        // Mask and continue
        const masked = await this.validator.applyMasking(chunk);
        this.status = blocking.some(v => v.action === 'mask') ? 'open' : 'warning';

        decision = {
          status: this.status,
          output: masked,
          violations,
          metadata: {
            bufferSize: this.buffer.getState().tokenCount,
            totalViolations: this.violationCount,
            blockingViolations: this.blockingCount,
          },
        };
      }
    } else if (warnings.length > 0) {
      // Warning state
      this.status = 'warning';
      decision = {
        status: 'warning',
        output: chunk,
        violations,
        metadata: {
          bufferSize: this.buffer.getState().tokenCount,
          totalViolations: this.violationCount,
          blockingViolations: this.blockingCount,
        },
      };
    } else {
      // All clear
      this.status = 'open';
      decision = {
        status: 'open',
        output: chunk,
        violations: [],
        metadata: {
          bufferSize: this.buffer.getState().tokenCount,
          totalViolations: this.violationCount,
          blockingViolations: this.blockingCount,
        },
      };
    }

    return decision;
  }

  /**
   * Get current gate status
   */
  getStatus(): GateStatus {
    return this.status;
  }

  /**
   * Get statistics
   */
  getStats(): {
    status: GateStatus;
    violationCount: number;
    blockingCount: number;
    bufferState: ReturnType<RollingBuffer['getState']>;
  } {
    return {
      status: this.status,
      violationCount: this.violationCount,
      blockingCount: this.blockingCount,
      bufferState: this.buffer.getState(),
    };
  }

  /**
   * Reset gate state
   */
  reset(): void {
    this.status = 'open';
    this.violationCount = 0;
    this.blockingCount = 0;
    this.buffer.clear();
  }

  /**
   * Check if gate is allowing output
   */
  isOpen(): boolean {
    return this.status === 'open' || this.status === 'warning';
  }

  /**
   * Check if gate is closed
   */
  isClosed(): boolean {
    return this.status === 'closed';
  }
}
