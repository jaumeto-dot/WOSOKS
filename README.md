# WOS - Wine Operations System

Aplicación web para consultar vinos por outlet y ubicación.

## Uso seguro

Arranca siempre WOS con el backend:

```bash
python3 app.py
```

Abre `http://127.0.0.1:8000`.

El usuario inicial es `admin`. Si no se define la variable `WOS_ADMIN_PASSWORD`, la app genera una contraseña local y la guarda en `data/admin_password.txt`.

La versión pública estática no incluye datos de vinos embebidos. Los datos solo salen desde `/api/wines` después de iniciar sesión.

## Datos incluidos

- Vinos importados desde `Hoja Control SHIMA.xlsx`.
- Outlet inicial cargado: `SHIMA`.
- Outlets preparados: `SHIMA`, `LLUM I SAL`, `MEL`, `CERCLE`, `QUIOSC`.

## Funciones

- Buscador instantáneo.
- Filtros por outlet.
- Filtros rápidos por categoría.
- Desplegables por tipo, país, región, productor y añada.
- Ficha del vino con ubicaciones.
- Importación de Excel por outlet protegida para administradores.
- Histórico de importaciones con fecha, usuario, archivo, outlet y cantidad importada.
- Gestión de usuarios y roles.

## Roles

- `admin`: consulta vinos, importa Excel y gestiona usuarios.
- `editor`: consulta vinos e importa Excel.
- `viewer`: solo consulta vinos.

## Importaciones

1. Entra como administrador.
2. Selecciona el restaurante en los chips superiores.
3. Pulsa `Importar Excel`.
4. Sube un `.xlsx` con columnas reconocibles como `Referencia`, `Bodega/Productor`, `Uvas`, `Añada`, `País`, `Región`, `Precio` y `Ubic.`.

Cada importación desactiva las ubicaciones anteriores de ese outlet y activa las referencias del nuevo Excel.

Los Excel importados se guardan separados por outlet:

- `data/imports/SHIMA/`
- `data/imports/LLUM_I_SAL/`
- `data/imports/MEL/`
- `data/imports/CERCLE/`
- `data/imports/QUIOSC/`

Cada archivo queda guardado con fecha y hora para saber cuál fue la última carga.

## Supabase

En servidor, define `DATABASE_URL` con la URI de Supabase.

La app usará PostgreSQL/Supabase automáticamente cuando exista `DATABASE_URL`; si no existe, seguirá usando SQLite local.

Para preparar Supabase:

```bash
python3 supabase_setup.py
```

Ese script crea tablas, usuarios base, outlets y carga el Excel inicial de SHIMA.
