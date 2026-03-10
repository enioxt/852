#!/usr/bin/env python3

from __future__ import annotations

import json
import random
import sys
import urllib.error
import urllib.request

LIMIT = 12
ATTEMPTS = 14


def post(base_url: str, client_ip: str) -> int:
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/chat",
        data=json.dumps({'messages': [{'role': 'user', 'content': 'teste'}]}).encode(),
        headers={
            'Content-Type': 'application/json',
            'X-Forwarded-For': client_ip,
        },
        method='POST',
    )

    try:
        with urllib.request.urlopen(request) as response:
            return response.status
    except urllib.error.HTTPError as error:
        return error.code


def make_client_ip() -> str:
    return f"203.0.113.{random.randint(1, 254)}"


def main() -> int:
    if len(sys.argv) != 2:
        print('Usage: python3 scripts/verify_rate_limit.py <base-url>', file=sys.stderr)
        return 1

    base_url = sys.argv[1]
    client_ip = make_client_ip()
    print(f'Client IP: {client_ip}')
    codes = [post(base_url, client_ip) for _ in range(ATTEMPTS)]

    for index, code in enumerate(codes, start=1):
        print(f'{index}: {code}')

    if codes[:LIMIT] != [200] * LIMIT:
        print('Expected first requests to return 200.', file=sys.stderr)
        return 1

    if codes[LIMIT] != 429:
        print('Expected request after limit to return 429.', file=sys.stderr)
        return 1

    if any(code != 429 for code in codes[LIMIT:]):
        print('Expected all requests after the limit to remain 429 within the window.', file=sys.stderr)
        return 1

    print('Rate limit verification OK')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
