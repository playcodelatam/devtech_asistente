<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DevTech AI Consultant

Aplicación de consultoría de IA con conversación por voz en tiempo real usando Google Gemini.

View your app in AI Studio: https://ai.studio/apps/drive/1gefo226pXJ0Kwy512ae-uFCs_q0e5ohc

## 🚀 Despliegue

### Cloudflare Pages (Recomendado)

Para desplegar en Cloudflare Pages, consulta la guía completa: [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md)

**Despliegue rápido:**
```bash
npm install -g wrangler
wrangler login
npm run deploy
```

### Vercel

Para desplegar en Vercel:
```bash
npm install -g vercel
vercel
```

## 💻 Desarrollo Local

**Requisitos:** Node.js 20+

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variable de entorno:
   - Crea archivo `.env.local`
   - Agrega: `GEMINI_API_KEY=tu_api_key_aqui`
   - Obtén tu API key en: https://aistudio.google.com

3. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir en el navegador:
   ```
   http://localhost:3000
   ```

## 📦 Scripts disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run deploy` - Desplegar a Cloudflare Pages
- `npm run cf:dev` - Desarrollo local con Wrangler
