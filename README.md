# StartGrows — Business Intelligence

Panel de control financiero y de marketing para StartGrows. Construido con Next.js 16, React 19, TypeScript y Supabase.

## ✨ Funcionalidades

- **Overview** — KPIs globales, objetivo de €10.000/mes, gráficas de proyección, ranking de canales, break-even.
- **Marketing** — Clientes recurrentes con ticket, % de comisión y canal individuales. Cierre de mes con histórico.
- **Financiero** — Cierres de pago único con canales de captación 100% editables (añadir/quitar/renombrar).
- **Personal** — Equipo con salario fijo, bonus, país, contacto. Comisiones por cliente cerrado (vinculadas a un cliente real de Marketing/Financiero o registradas manualmente). Overview de pagado vs generado a 1/3/6/12/24 meses. Vacantes y puestos de trabajo. Reuniones recurrentes.
- **Historial** — Archivo mensual con gráfica de evolución.
- **Config** — Edición global de todos los costes fijos, variables y canales.

Todos los datos se guardan automáticamente en Supabase con un debounce de 1.2s tras cada cambio.

## 🚀 Cómo correrlo en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 🔑 Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_APP_PASSWORD=tu-contraseña
```

> El archivo `.env.local` ya incluye tus credenciales reales de StartGrows — no hace falta tocarlo si vas a desplegar el mismo proyecto.

## 🗄️ Base de datos (Supabase)

Ejecuta esto una vez en el SQL Editor de tu proyecto de Supabase:

```sql
create table app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table app_state enable row level security;

create policy "Allow anon read/write"
on app_state
for all
using (true)
with check (true);
```

## 📦 Despliegue en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → selecciona el repo.
3. En **Settings → Environment Variables**, añade las 3 variables del `.env.local`.
4. Deploy.

## 📁 Estructura del proyecto

```
app/
  layout.tsx          → fuentes, metadata, favicon
  page.tsx             → login gate + ensamblaje de la app
  globals.css          → design system completo (colores, componentes)
components/
  Login.tsx
  TopBar.tsx            → barra superior con indicador de guardado en vivo
  Tabs.tsx
  shared.tsx            → helpers de UI reutilizados (pills de canal, alertas)
  tabs/
    Overview.tsx
    Marketing.tsx
    Financiero.tsx
    Personal.tsx
    Historial.tsx
    Config.tsx
  personal/
    EmployeeCard.tsx      → ficha de empleado con producción y comisiones
    CommissionModal.tsx   → registrar comisión (vinculada o manual)
    JobsList.tsx
    MeetingsList.tsx
lib/
  types.ts              → tipos centrales de toda la app
  defaultState.ts        → estado inicial por defecto
  calculations.ts         → toda la lógica de negocio (cálculos financieros)
  supabase.ts            → cliente de Supabase
store/
  useAppStore.tsx        → estado global (Context API) + persistencia automática
```

## 🧮 Lógica de negocio clave

- **Marketing**: ingreso = ticket × tu % ; coste = variables estándar + extra del cliente + comisión de setter (inbound €40 / outbound €85, solo en el primer cierre).
- **Financiero**: pago único en USD convertido a EUR con FX editable; coste = comisión del canal + closer opcional.
- **Comisiones de personal**: cada comisión registrada se vincula opcionalmente a un cliente real de Marketing o Financiero (o se registra manualmente), calculando automáticamente importe × % de comisión.

---

Hecho con Next.js + TypeScript + Supabase.
