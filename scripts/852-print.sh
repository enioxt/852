#!/bin/bash
# 852-Print: Universal Screenshot Hub for Wayland/X11
# Requires: yad, wl-clipboard, gnome-screenshot, nodejs, puppeteer

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CHOICE=$(yad --title="852 Captura Inteligente" \
    --text="Escolha o modo de captura:\n" \
    --window-icon=camera-photo \
    --button="📸 Normal (Área/Janela/Tela):1" \
    --button="🌐 Página Inteira (Requer URL):2" \
    --button="❌ Cancelar:0" \
    --width=350 --center --on-top \
    --fixed)

RET=$?

if [ $RET -eq 1 ]; then
    # Chama o utilitário nativo com interface interativa
    # Fica aguardando a captura terminar
    gnome-screenshot -i
    
elif [ $RET -eq 2 ]; then
    # Tenta pegar a URL do clipboard caso o usuario ja tenha copiado
    CLIP=$(wl-paste 2>/dev/null || xclip -o -selection clipboard 2>/dev/null)
    # Se o clipboard nao parecer uma url, deixa vazio
    if [[ ! "$CLIP" =~ ^http.* ]] && [[ ! "$CLIP" =~ ^www\..* ]]; then
        CLIP=""
    fi

    URL=$(yad --entry --title="Página Inteira" \
              --text="Cole o link (URL) da página que deseja capturar por inteiro:" \
              --entry-text="$CLIP" \
              --width=450 --center --on-top)
              
    if [ -n "$URL" ]; then
        TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
        OUTDIR="$HOME/Pictures/Screenshots"
        mkdir -p "$OUTDIR"
        OUTFILE="$OUTDIR/Captura_Completa_$TIMESTAMP.png"
        
        # Display progress and run capture
        (
            echo "10"
            echo "# Iniciando navegador invisível..."
            
            # Run node script using puppeteer
            cd "$DIR"
            if [ ! -d "node_modules/puppeteer" ]; then
                echo "# Instalando motor headless (Primeira vez apenas)..."
                npm install puppeteer > /dev/null 2>&1
            fi
            
            echo "40"
            echo "# Acessando a página e renderizando pixels..."
            
            node capture.js "$URL" "$OUTFILE"
            
            if [ $? -eq 0 ]; then
                echo "100"
                echo "# Concluído."
            else
                echo "# Falha."
                sleep 2
                exit 1
            fi
        ) | yad --progress --title="🚀 Capturando Página..." --text="Aguarde, processando a rolagem..." --pulsate --auto-close --auto-kill --width=350 --center --on-top
        
        if [ -f "$OUTFILE" ]; then
            # Copy to clipboard
            if command -v wl-copy &> /dev/null; then
                wl-copy < "$OUTFILE"
            elif command -v xclip &> /dev/null; then
                xclip -selection clipboard -t image/png -i "$OUTFILE"
            fi
            
            yad --info --title="Sucesso 📸" \
                --text="\n<span font='12'><b>Página capturada com sucesso!</b></span>\n\nA imagem final possui o tamanho exato de todo o conteúdo da página com rolagem completa.\n\n📁 Salva em: <b>$OUTFILE</b>\n📋 <i>Você já pode dar Control+V no WhatsApp/Email para colar a imagem!</i>" \
                --width=450 --center --on-top \
                --button="OK:0"
        else
            yad --error --title="Erro ❌" --text="Falha ao tentar capturar a página solicitada. Verifique a URL e sua conexão." --center
        fi
    fi
fi
