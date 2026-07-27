import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de ArcadePlay",
}

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="mb-8 text-3xl font-bold text-foreground">
        Términos y Condiciones
      </h1>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Bienvenida</h2>
          <p>
            ArcadePlay es una plataforma comunitaria donde podés descubrir, jugar y publicar videojuegos
            creados con MakeCode Arcade y Scratch. Al usar ArcadePlay, aceptás estos términos.
            Si no estás de acuerdo, no uses la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Edad y supervisión</h2>
          <p>
            ArcadePlay está dirigida principalmente a niños, niñas y adolescentes. Si tenés menos de 13 años,
            te recomendamos usar la plataforma con la supervisión de un adulto responsable. Los padres,
            madres o tutores son responsables de la actividad de los menores a su cargo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Normas de convivencia</h2>
          <p>Para mantener un ambiente seguro y respetuoso, todos los usuarios deben cumplir estas reglas:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Respeto mutuo.</strong> Tratá a los demás como te gustaría ser tratado. No se permite insultar, acosar, intimidar ni discriminar a otros usuarios por ningún motivo.</li>
            <li><strong>Lenguaje apropiado.</strong> No se permite el uso de lenguaje vulgar, obsceno, ofensivo o inapropiado en ninguna parte de la plataforma (nombres de usuario, títulos de juegos, descripciones, comentarios, etc.).</li>
            <li><strong>Sin contenido para adultos.</strong> Está terminantemente prohibido publicar juegos, imágenes, enlaces o cualquier contenido de naturaleza sexual, violenta extrema, o inapropiada para menores de edad.</li>
            <li><strong>Sin datos personales.</strong> No compartas información personal tuya ni de otras personas (nombre completo, dirección, teléfono, contraseñas, etc.) en juegos, perfiles o comentarios.</li>
            <li><strong>Colaboración positiva.</strong> Alentamos la creatividad y el aprendizaje. Compartí feedback constructivo, celebrá el trabajo de otros y ayudá a mantener una comunidad positiva.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Contenido de los juegos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sos responsable del contenido que publicás. Asegurate de que tus juegos cumplan con estas normas.</li>
            <li>No publiques juegos que copien o infrinjan los derechos de autor de otras personas.</li>
            <li>El equipo de moderación de ArcadePlay se reserva el derecho de revisar, modificar o eliminar cualquier juego que no cumpla con estas normas.</li>
            <li>Los juegos que publiques deben ser creaciones propias realizadas en MakeCode Arcade o Scratch.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Moderación y sanciones</h2>
          <p>
            ArcadePlay cuenta con un equipo de moderación que revisa el contenido publicado. Las infracciones
            a estas normas pueden resultar en:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Rechazo o eliminación del juego publicado.</li>
            <li>Suspensión temporal o permanente de la cuenta.</li>
            <li>Eliminación de comentarios o contenido inapropiado.</li>
          </ul>
          <p>
            Las decisiones del equipo de moderación son finales. Si considerás que una decisión fue injusta,
            podés comunicarte con nosotros a través de los canales disponibles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Privacidad</h2>
          <p>
            Respetamos tu privacidad. La información que recopilamos (nombre de usuario, email, juegos publicados)
            se utiliza exclusivamente para el funcionamiento de la plataforma. No compartimos datos personales
            con terceros. Para más información, consultá nuestra política de privacidad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Propiedad intelectual</h2>
          <p>
            Los juegos que publicás en ArcadePlay son de tu propiedad. Al publicar un juego en la plataforma,
            nos otorgás el derecho de mostrarlo, compartirlo y promocionarlo dentro de ArcadePlay.
            Los logos, nombres y marcas de MakeCode Arcade y Scratch pertenecen a sus respectivos dueños
            (Microsoft y MIT, respectivamente).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Cambios en los términos</h2>
          <p>
            Estos términos pueden actualizarse ocasionalmente. Te notificaremos sobre cambios importantes.
            El uso continuado de la plataforma después de una actualización implica la aceptación de los
            nuevos términos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Contacto</h2>
          <p>
            Si tenés preguntas, sugerencias o necesitás reportar contenido inapropiado, podés contactarnos
            a través de los canales de comunicación disponibles en la plataforma.
          </p>
        </section>

        <p className="pt-4 text-sm text-muted-foreground">
          Última actualización: julio de 2026.
        </p>
      </div>
    </main>
  )
}
