/**
 * Database Seed Script
 * Seeds default transformation types
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Default transformation types
  const transformationTypes = [
    {
      name: 'Person Wearing Crown',
      description: 'Transform the person in the image to wear a royal crown',
      promptTemplate: 'Transform the person in this image to wear a royal crown. Make it look natural and regal.',
      enabled: true,
    },
    {
      name: 'Person Delivering Speech',
      description: 'Transform the person to appear as if they are delivering a speech',
      promptTemplate: 'Transform the person in this image to appear as if they are delivering a speech. Add a podium or stage if appropriate.',
      enabled: true,
    },
    {
      name: 'Person Doing Gym',
      description: 'Transform the person to appear as if they are working out at a gym',
      promptTemplate: 'Transform the person in this image to appear as if they are working out at a gym. Add gym equipment and appropriate workout attire.',
      enabled: true,
    },
    {
      name: 'Person at Beach',
      description: 'Transform the person to appear at a beach setting',
      promptTemplate: 'Transform the person in this image to appear at a beautiful beach. Add beach scenery, sand, and ocean in the background.',
      enabled: true,
    },
    {
      name: 'Person in Formal Attire',
      description: 'Transform the person to wear formal business attire',
      promptTemplate: 'Transform the person in this image to wear formal business attire. Make them look professional and well-dressed.',
      enabled: true,
    },
  ];

  // Create transformation types
  for (const type of transformationTypes) {
    const existing = await prisma.transformationType.findUnique({
      where: { name: type.name },
    });

    if (!existing) {
      await prisma.transformationType.create({
        data: type,
      });
      console.log(`Created transformation type: ${type.name}`);
    } else {
      console.log(`Transformation type already exists: ${type.name}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

