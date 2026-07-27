# Plantillas de Email — ArcadePlay

Estas plantillas se configuran en **Supabase Dashboard > Authentication > Email Templates**.

Reemplazá el HTML de cada plantilla con el contenido correspondiente abajo.

---

## Confirm Signup (Verificación de cuenta)

**Asunto:** `Verificá tu cuenta en ArcadePlay`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#4b7bff,#a64dff);padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700">Bienvenido a ArcadePlay</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0 0">Creá, jugá y compartí videojuegos</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px 24px">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px 0">
          ¡Hola! Gracias por registrarte en <strong style="color:#4b7bff">ArcadePlay</strong>.
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px 0">
          Para empezar a usar tu cuenta, verificá tu dirección de email haciendo clic en el botón de abajo:
        </p>

        <!-- Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(90deg,#4b7bff,#a64dff);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;box-shadow:0 4px 12px rgba(107,77,255,0.3)">Verificar mi cuenta</a>
            </td>
          </tr>
        </table>

        <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:24px 0 0 0">
          Si no creaste una cuenta en ArcadePlay, ignorá este mensaje.
        </p>
        <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:4px 0 0 0">
          Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
          <a href="{{ .ConfirmationURL }}" style="color:#4b7bff;word-break:break-all;font-size:12px">{{ .ConfirmationURL }}</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px;margin:0">
          ArcadePlay — Plataforma de juegos MakeCode Arcade y Scratch
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Reset Password

**Asunto:** `Restablecé tu contraseña de ArcadePlay`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <tr>
      <td style="background:linear-gradient(135deg,#4b7bff,#a64dff);padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700">Restablecer contraseña</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0 0">ArcadePlay</p>
      </td>
    </tr>

    <tr>
      <td style="padding:32px 24px">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px 0">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px 0">
          Hacé clic en el botón para crear una nueva contraseña:
        </p>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(90deg,#4b7bff,#a64dff);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;box-shadow:0 4px 12px rgba(107,77,255,0.3)">Restablecer contraseña</a>
            </td>
          </tr>
        </table>

        <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:24px 0 0 0">
          Si no solicitaste este cambio, ignorá este mensaje. Tu contraseña no se modificará.
        </p>
      </td>
    </tr>

    <tr>
      <td style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px;margin:0">ArcadePlay</p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Magic Link (si se habilita)

**Asunto:** `Tu enlace mágico de ArcadePlay`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <tr>
      <td style="background:linear-gradient(135deg,#4b7bff,#a64dff);padding:32px 24px;text-align:center">
        <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700">Iniciar sesión</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0 0">ArcadePlay</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px 0">
          Hacé clic en el botón para iniciar sesión en ArcadePlay:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(90deg,#4b7bff,#a64dff);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;box-shadow:0 4px 12px rgba(107,77,255,0.3)">Iniciar sesión</a>
            </td>
          </tr>
        </table>
        <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:24px 0 0 0">
          Si no solicitaste este enlace, ignorá este mensaje.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px;margin:0">ArcadePlay</p>
      </td>
    </tr>
  </table>
</body>
</html>
```
