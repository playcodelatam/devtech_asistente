# Despliegue en Cloudflare Pages

Esta guía te ayudará a desplegar la aplicación DevTech AI Consultant en Cloudflare Pages.

## 📋 Requisitos previos

- Cuenta de Cloudflare (gratuita)
- API Key de Google Gemini
- Repositorio en GitHub

## 🚀 Método 1: Despliegue desde el Dashboard (Recomendado)

### Paso 1: Acceder a Cloudflare

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Inicia sesión o crea una cuenta gratuita

### Paso 2: Crear proyecto en Pages

1. En el menú lateral, selecciona **Workers & Pages**
2. Click en **Create application**
3. Selecciona la pestaña **Pages**
4. Click en **Connect to Git**

### Paso 3: Conectar repositorio

1. Autoriza a Cloudflare a acceder a tu GitHub
2. Selecciona el repositorio: `playcodelatam/devtech_asistente`
3. Click en **Begin setup**

### Paso 4: Configurar build

Usa la siguiente configuración:

- **Project name**: `devtech-asistente` (o el nombre que prefieras)
- **Production branch**: `main` (o tu rama principal)
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### Paso 5: Variables de entorno

1. En la sección **Environment variables**, click en **Add variable**
2. Agrega:
   - **Variable name**: `GEMINI_API_KEY` (sin prefijo VITE_)
   - **Value**: Tu API key de Google Gemini
3. Click en **Save and Deploy**

⚠️ **Importante**: En Cloudflare Pages usa `GEMINI_API_KEY` (sin VITE_). El prefijo VITE_ solo es para desarrollo local.

### Paso 6: Esperar el despliegue

- El primer build toma 2-3 minutos
- Una vez completado, obtendrás una URL como: `https://devtech-asistente.pages.dev`

---

## 🔧 Método 2: Despliegue con CLI (Wrangler)

### Instalación de Wrangler

```bash
npm install -g wrangler
```

### Login en Cloudflare

```bash
wrangler login
```

Esto abrirá tu navegador para autorizar la CLI.

### Build del proyecto

```bash
npm run build
```

### Desplegar

```bash
wrangler pages deploy dist --project-name=devtech-asistente
```

### Configurar variable de entorno

```bash
wrangler pages secret put GEMINI_API_KEY
```

Cuando se te solicite, pega tu API key de Gemini.

### Despliegues futuros

Usa el script npm:

```bash
npm run deploy
```

---

## 🔑 Obtener API Key de Google Gemini

1. Ve a [aistudio.google.com](https://aistudio.google.com)
2. Inicia sesión con tu cuenta de Google
3. Click en **Get API key** en el menú lateral
4. Click en **Create API key**
5. Copia la key generada

---

## 🌐 Configurar dominio personalizado (Opcional)

### Si tienes un dominio en Cloudflare:

1. En tu proyecto de Pages, ve a **Custom domains**
2. Click en **Set up a custom domain**
3. Ingresa tu dominio (ej: `devtech.tudominio.com`)
4. Cloudflare configurará automáticamente los DNS

### Si tu dominio está en otro registrador:

1. Sigue los pasos anteriores
2. Cloudflare te dará instrucciones para agregar un registro CNAME
3. Agrega el CNAME en tu registrador de dominios

---

## 🔄 Despliegues automáticos

Cloudflare Pages desplegará automáticamente cuando:

- Hagas push a la rama principal (producción)
- Hagas push a cualquier otra rama (preview deployment)

Cada rama obtiene su propia URL de preview:
- Producción: `https://devtech-asistente.pages.dev`
- Preview: `https://[branch-name].devtech-asistente.pages.dev`

---

## 📊 Monitoreo y logs

### Ver logs de build:

1. En el dashboard de Cloudflare Pages
2. Selecciona tu proyecto
3. Ve a la pestaña **Deployments**
4. Click en cualquier deployment para ver los logs

### Ver analytics:

1. En tu proyecto, ve a **Analytics**
2. Verás métricas de:
   - Requests
   - Bandwidth
   - Errores
   - Latencia

---

## 🐛 Troubleshooting

### Error: "Build failed"

- Verifica que `npm run build` funcione localmente
- Revisa los logs del build en Cloudflare
- Asegúrate de que todas las dependencias estén en `package.json`

### Error: "GEMINI_API_KEY is not defined"

- Verifica que agregaste la variable de entorno en Cloudflare
- Para producción: Settings → Environment variables → Production
- Para preview: Settings → Environment variables → Preview

### La aplicación no carga:

- Verifica que el `Build output directory` sea `dist`
- Revisa la consola del navegador para errores
- Verifica que la API key de Gemini sea válida

---

## 💰 Límites del plan gratuito

- **Builds**: 500/mes
- **Bandwidth**: Ilimitado
- **Requests**: Ilimitados
- **Proyectos**: 100
- **Dominios custom**: 100 por proyecto

---

## 📚 Recursos adicionales

- [Documentación de Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Community](https://community.cloudflare.com/)

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs en el dashboard de Cloudflare
2. Consulta la [documentación oficial](https://developers.cloudflare.com/pages/)
3. Pregunta en el [foro de la comunidad](https://community.cloudflare.com/)
