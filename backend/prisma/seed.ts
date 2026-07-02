import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed — dane początkowe wpisane na sztywno (zgodnie ze specyfikacją).
 * Tworzy: sale kinowe z automatycznie generowanymi fotelami, filmy oraz
 * kilkanaście seansów w najbliższych dniach. Rola administratora niewymagana.
 *
 * Seed jest idempotentny: najpierw czyści dane, potem wypełnia od nowa,
 * dzięki czemu można go bezpiecznie uruchamiać wielokrotnie.
 */

async function main() {
  // Idempotencja: jeśli baza jest już wypełniona (np. restart kontenera),
  // pomijamy seed, by nie skasować rezerwacji użytkowników.
  const existingMovies = await prisma.movie.count();
  if (existingMovies > 0) {
    console.log('🌱 Seed: dane już istnieją — pomijam.');
    return;
  }

  console.log('🌱 Seed: wypełnianie bazy danymi początkowymi...');

  // ---- Sale kinowe (z automatycznie generowanymi fotelami) ----
  const hallsSpec = [
    { name: 'Sala 1', rows: 8, cols: 12 },
    { name: 'Sala 2', rows: 6, cols: 10 },
    { name: 'Sala 3 (VIP)', rows: 5, cols: 8 },
  ];

  const halls = [];
  for (const spec of hallsSpec) {
    const hall = await prisma.hall.create({
      data: {
        name: spec.name,
        rows: spec.rows,
        cols: spec.cols,
        seats: {
          create: Array.from({ length: spec.rows }, (_, r) =>
            Array.from({ length: spec.cols }, (_, c) => ({
              row: r + 1,
              col: c + 1,
            }))
          ).flat(),
        },
      },
    });
    halls.push(hall);
    console.log(`  🎦 ${hall.name}: ${spec.rows}×${spec.cols} = ${spec.rows * spec.cols} miejsc`);
  }

  // ---- Filmy ----
  const moviesSpec = [
    {
      title: 'Incepcja',
      description:
        'Złodziej kradnący sekrety z podświadomości dostaje szansę na odkupienie — musi dokonać czegoś odwrotnego: zaszczepić ideę.',
      durationMin: 148,
      posterUrl: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    },
    {
      title: 'Matrix',
      description:
        'Haker odkrywa, że rzeczywistość to symulacja, i dołącza do buntu przeciw maszynom kontrolującym ludzkość.',
      durationMin: 136,
      posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    },
    {
      title: 'Interstellar',
      description:
        'Grupa badaczy przemierza tunel czasoprzestrzenny w poszukiwaniu nowego domu dla ludzkości.',
      durationMin: 169,
      posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    },
    {
      title: 'Skazani na Shawshank',
      description:
        'Niesłusznie skazany bankier zaprzyjaźnia się ze współwięźniem i przez lata nie traci nadziei na wolność.',
      durationMin: 142,
      posterUrl: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    },
    {
      title: 'Diuna: Część druga',
      description:
        'Paul Atryda łączy siły z Fremenami, by pomścić rodzinę i zapobiec przerażającej przyszłości.',
      durationMin: 166,
      posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    },
  ];

  const movies = [];
  for (const spec of moviesSpec) {
    const movie = await prisma.movie.create({ data: spec });
    movies.push(movie);
  }
  console.log(`  🎬 Utworzono ${movies.length} filmów`);

  // ---- Seanse (kilkanaście w najbliższych dniach) ----
  // Generujemy seanse na 5 najbliższych dni, o kilku porach, w różnych salach.
  const showtimes = [12, 15, 18, 21]; // godziny rozpoczęcia
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let screeningCount = 0;
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    for (let s = 0; s < showtimes.length; s++) {
      const startsAt = new Date(startOfToday);
      startsAt.setDate(startsAt.getDate() + dayOffset);
      startsAt.setHours(showtimes[s], 0, 0, 0);

      // Rotujemy filmy i sale, by repertuar był zróżnicowany.
      const movie = movies[(dayOffset + s) % movies.length];
      const hall = halls[s % halls.length];
      const price = hall.name.includes('VIP') ? 3500 : 2500; // w groszach

      await prisma.screening.create({
        data: {
          movieId: movie.id,
          hallId: hall.id,
          startsAt,
          price,
        },
      });
      screeningCount++;
    }
  }
  console.log(`  🕐 Utworzono ${screeningCount} seansów na najbliższe 5 dni`);

  console.log('✅ Seed zakończony pomyślnie.');
}

main()
  .catch((e) => {
    console.error('❌ Seed nie powiódł się:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
