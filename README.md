# VetEmpleo

Plataforma de empleo veterinario: veterinarios, ATV y auxiliares crean su CV y se postulan; clínicas, hospitales
y empresas publican ofertas **con las condiciones obligatorias** que LinkedIn e InfoJobs no exigen: rango salarial
real, horas y horario, guardias (cuántas y cómo se pagan), fines de semana, convenio, vacaciones, periodo de prueba,
plantilla, equipamiento, fases del proceso y plazo de respuesta.

## Stack
- Next.js 16 (App Router, Server Actions) + Tailwind 4
- Supabase (Postgres + Auth + Storage para los CV en PDF), con RLS
- Vercel

## Ramas y entornos
| Rama | Entorno Vercel | Uso |
|------|----------------|-----|
| `main` | Production | Lo que ven los usuarios |
| `dev`  | Preview | Desarrollo; cada push genera una URL de preview |

Flujo: trabaja en `dev` (o ramas `feature/*` → PR a `dev`), y cuando esté probado, PR `dev` → `main`.

## Desarrollo local
```bash
cp .env.example .env.local   # rellena URL y publishable key de Supabase
npm install
npm run dev
```

## Base de datos
Las migraciones están en `supabase/migrations/`. Reglas clave a nivel de base de datos:
- Una oferta no se puede guardar sin los campos obligatorios; el salario máximo ≤ 2× el mínimo; si hay guardias
  hay que explicar cuántas y cómo se pagan; vacaciones ≥ 22 días; contrato no indefinido ⇒ duración.
- Un candidato solo es visible para las empresas a cuyas ofertas se ha postulado (también su CV).
- La empresa solo puede cambiar el estado y la nota de una candidatura.

## Roles
Se elige al registrarse (`veterinario` o `empresa`) y se guarda en `profiles.role`.
