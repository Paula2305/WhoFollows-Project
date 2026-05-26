@AGENTS.md

# Objetivo del proyecto

WhoFollows es una aplicación web que analiza datos de seguidores de Instagram. El usuario sube los dos JSON que exporta Instagram (followers + following) y la app le muestra a quién sigue que no le sigue de vuelta.

## Alcance por release

- **R1:** analizador (lógica migrada de un script Python a TypeScript, ejecutada en el navegador, Web Worker si hace falta), reseñas de usuarios persistidas en Firestore (validadas vía Cloud Function + App Check), y contador público exacto de "análisis ejecutados" mediante un distributed counter de Firestore.
- **R2:** registro de usuarios con Firebase Auth (Google/email) e historial de consultas por usuario. Por defecto se almacenan **solo metadatos** (fecha, número de no-seguidores, etc.), no los nombres reales.

## Stack

Next.js (App Router) en el frontend + análisis 100% en cliente + Firebase como backend (Firestore, Auth, Cloud Functions, App Check). Hosting en Vercel o Firebase Hosting. **No** hay backend en .NET y no debe introducirse: el análisis es un set diff puro sobre JSON, no requiere ciclos de servidor.

## Restricción de privacidad (no negociable)

Los JSON de Instagram contienen nombres de terceros (datos personales bajo GDPR). Reglas:
- Los JSON se parsean y comparan **íntegramente en el navegador**. Nunca se suben a un servidor.
- El historial de R2 guarda **solo metadatos** por defecto. Guardar la lista real de no-seguidores requiere opt-in explícito del usuario.
- Cualquier diseño que envíe los JSON crudos o listas de usernames al servidor por defecto debe rechazarse o marcarse antes de implementar.

"Tus datos nunca salen de tu dispositivo" es a la vez una obligación legal y el argumento de venta del producto.
