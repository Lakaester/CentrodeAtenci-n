#!/usr/bin/env bash
# Instala todas las dependencias (backend + frontend) de una sola vez.
set -e
echo ">> Instalando dependencias del proyecto..."
npm install
echo ">> Generando cliente de Prisma..."
npm run prisma:generate || echo "(Se generará cuando la base esté lista)"
echo ">> Listo. Ejecuta 'npm run dev' para arrancar."
