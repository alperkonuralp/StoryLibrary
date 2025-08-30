import { PrismaClient, UserRole, StoryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@storylibrary.com' },
    update: {},
    create: {
      email: 'admin@storylibrary.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        bio: 'System administrator'
      }
    }
  });

  // Create editor user
  console.log('✏️ Creating editor user...');
  const editorPassword = await bcrypt.hash('editor123', 12);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@storylibrary.com' },
    update: {},
    create: {
      email: 'editor@storylibrary.com',
      username: 'editor',
      passwordHash: editorPassword,
      role: UserRole.EDITOR,
      profile: {
        firstName: 'Editor',
        lastName: 'User',
        bio: 'Content editor and curator'
      }
    }
  });

  // Create regular user
  console.log('👥 Creating regular user...');
  const userPassword = await bcrypt.hash('user123', 12);
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@storylibrary.com' },
    update: {},
    create: {
      email: 'user@storylibrary.com',
      username: 'user',
      passwordHash: userPassword,
      role: UserRole.USER,
      profile: {
        firstName: 'Regular',
        lastName: 'User',
        bio: 'Language learning enthusiast'
      }
    }
  });

  // Create categories
  console.log('📚 Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'fiction' },
      update: {},
      create: {
        name: { en: 'Fiction', tr: 'Kurgu' },
        description: { en: 'Fictional stories and narratives', tr: 'Kurgusal hikayeler ve anlatılar' },
        slug: 'fiction'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: { en: 'Technology', tr: 'Teknoloji' },
        description: { en: 'Tech articles and programming stories', tr: 'Teknoloji makaleleri ve programlama hikayeleri' },
        slug: 'technology'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'business' },
      update: {},
      create: {
        name: { en: 'Business', tr: 'İş' },
        description: { en: 'Business and entrepreneurship stories', tr: 'İş ve girişimcilik hikayeleri' },
        slug: 'business'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'culture' },
      update: {},
      create: {
        name: { en: 'Culture', tr: 'Kültür' },
        description: { en: 'Cultural stories and traditions', tr: 'Kültürel hikayeler ve gelenekler' },
        slug: 'culture'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'science' },
      update: {},
      create: {
        name: { en: 'Science', tr: 'Bilim' },
        description: { en: 'Science and research stories', tr: 'Bilim ve araştırma hikayeleri' },
        slug: 'science'
      }
    })
  ]);

  // Create tags
  console.log('🏷️ Creating tags...');
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'beginner' },
      update: {},
      create: {
        name: { en: 'Beginner', tr: 'Başlangıç' },
        slug: 'beginner',
        color: '#10B981'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'intermediate' },
      update: {},
      create: {
        name: { en: 'Intermediate', tr: 'Orta' },
        slug: 'intermediate',
        color: '#F59E0B'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'advanced' },
      update: {},
      create: {
        name: { en: 'Advanced', tr: 'İleri' },
        slug: 'advanced',
        color: '#EF4444'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'short' },
      update: {},
      create: {
        name: { en: 'Short', tr: 'Kısa' },
        slug: 'short',
        color: '#8B5CF6'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'long' },
      update: {},
      create: {
        name: { en: 'Long', tr: 'Uzun' },
        slug: 'long',
        color: '#F97316'
      }
    })
  ]);

  // Create authors
  console.log('✍️ Creating authors...');
  const authors = await Promise.all([
    prisma.author.upsert({
      where: { slug: 'jane-doe' },
      update: {},
      create: {
        name: 'Jane Doe',
        bio: {
          en: 'Jane Doe is a bestselling author known for her engaging storytelling and vivid characters.',
          tr: 'Jane Doe, ilgi çekici hikaye anlatımı ve canlı karakterleriyle tanınan çok satan bir yazardır.'
        },
        slug: 'jane-doe'
      }
    }),
    prisma.author.upsert({
      where: { slug: 'john-smith' },
      update: {},
      create: {
        name: 'John Smith',
        bio: {
          en: 'John Smith is a technology writer with over 10 years of experience in software development.',
          tr: 'John Smith, yazılım geliştirmede 10 yılı aşkın deneyime sahip bir teknoloji yazarıdır.'
        },
        slug: 'john-smith'
      }
    }),
    prisma.author.upsert({
      where: { slug: 'ayse-yilmaz' },
      update: {},
      create: {
        name: 'Ayşe Yılmaz',
        bio: {
          en: 'Ayşe Yılmaz is a Turkish writer who specializes in cultural stories and traditions.',
          tr: 'Ayşe Yılmaz, kültürel hikayeler ve gelenekler konusunda uzmanlaşmış Türk bir yazardır.'
        },
        slug: 'ayse-yilmaz'
      }
    })
  ]);

  // Create series
  console.log('📖 Creating series...');
  const series = await Promise.all([
    prisma.series.upsert({
      where: { slug: 'learning-english' },
      update: {},
      create: {
        name: { en: 'Learning English', tr: 'İngilizce Öğrenme' },
        description: {
          en: 'A series of stories designed to help Turkish speakers learn English',
          tr: 'Türkçe konuşanlara İngilizce öğrenmeye yardımcı olmak için tasarlanmış hikaye serisi'
        },
        slug: 'learning-english'
      }
    }),
    prisma.series.upsert({
      where: { slug: 'tech-tales' },
      update: {},
      create: {
        name: { en: 'Tech Tales', tr: 'Teknoloji Hikayeleri' },
        description: {
          en: 'Stories about technology, programming, and the digital world',
          tr: 'Teknoloji, programlama ve dijital dünya hakkında hikayeler'
        },
        slug: 'tech-tales'
      }
    })
  ]);

  // Create sample stories
  console.log('📝 Creating sample stories...');
  const story1 = await prisma.story.upsert({
    where: { slug: 'the-coffee-shop' },
    update: {},
    create: {
      title: {
        en: 'The Coffee Shop',
        tr: 'Kahve Dükkanı'
      },
      shortDescription: {
        en: 'A story about a magical coffee shop that changes people\'s lives',
        tr: 'İnsanların hayatlarını değiştiren sihirli bir kahve dükkanı hakkında bir hikaye'
      },
      slug: 'the-coffee-shop',
      content: {
        en: [
          'Once upon a time, there was a small coffee shop on the corner of Main Street.',
          'Every morning, people would line up to get their daily dose of caffeine.',
          'But this was no ordinary coffee shop.',
          'The owner, Mrs. Chen, had a special gift.',
          'She could sense what each customer needed in their life.',
          'Some needed courage, others needed hope.',
          'And somehow, the coffee she served always contained exactly what they were looking for.'
        ],
        tr: [
          'Bir zamanlar, Ana Cadde\'nin köşesinde küçük bir kahve dükkanı vardı.',
          'Her sabah, insanlar günlük kafein dozlarını almak için sıraya girerlerdi.',
          'Ama bu sıradan bir kahve dükkanı değildi.',
          'Sahibi Bayan Chen\'in özel bir yeteneği vardı.',
          'Her müşterinin hayatında neye ihtiyacı olduğunu hissedebiliyordu.',
          'Bazılarının cesarete, diğerlerinin umuda ihtiyacı vardı.',
          'Ve bir şekilde, servis ettiği kahve her zaman aradıkları şeyi tam olarak içeriyordu.'
        ]
      },
      status: StoryStatus.PUBLISHED,
      statistics: {
        wordCount: { en: 89, tr: 87 },
        charCount: { en: 456, tr: 503 },
        estimatedReadingTime: { en: 1, tr: 1 }
      },
      editorRating: 4.5,
      averageRating: 4.5,
      ratingCount: 1,
      publishedAt: new Date(),
      createdBy: editor.id
    }
  });

  const story2 = await prisma.story.upsert({
    where: { slug: 'introduction-to-machine-learning' },
    update: {},
    create: {
      title: {
        en: 'Introduction to Machine Learning',
        tr: 'Makine Öğrenmesine Giriş'
      },
      shortDescription: {
        en: 'Learn the basics of machine learning through a simple story',
        tr: 'Basit bir hikaye aracılığıyla makine öğrenmesinin temellerini öğrenin'
      },
      slug: 'introduction-to-machine-learning',
      content: {
        en: [
          'Machine learning is like teaching a computer to recognize patterns.',
          'Imagine you want to teach a computer to recognize cats in photos.',
          'You would show it thousands of pictures of cats.',
          'The computer would learn to identify features that make a cat a cat.',
          'Eventually, it would be able to recognize cats in new photos.',
          'This is the basic principle behind machine learning.'
        ],
        tr: [
          'Makine öğrenmesi, bir bilgisayara kalıpları tanımayı öğretmek gibidir.',
          'Bir bilgisayara fotoğraflardaki kedileri tanımayı öğretmek istediğinizi düşünün.',
          'Ona binlerce kedi fotoğrafı gösterirsiniz.',
          'Bilgisayar, bir kediyi kedi yapan özellikleri tanımayı öğrenir.',
          'Sonunda, yeni fotoğraflardaki kedileri tanıyabilir hale gelir.',
          'Bu, makine öğrenmesinin arkasındaki temel prensiptir.'
        ]
      },
      status: StoryStatus.PUBLISHED,
      statistics: {
        wordCount: { en: 74, tr: 78 },
        charCount: { en: 398, tr: 445 },
        estimatedReadingTime: { en: 1, tr: 1 }
      },
      editorRating: 4.0,
      averageRating: 4.0,
      ratingCount: 1,
      publishedAt: new Date(),
      createdBy: editor.id
    }
  });

  const story3 = await prisma.story.upsert({
    where: { slug: 'the-startup-journey' },
    update: {},
    create: {
      title: {
        en: 'The Startup Journey',
        tr: 'Girişim Yolculuğu'
      },
      shortDescription: {
        en: 'Follow Sarah as she builds her first startup from an idea to success',
        tr: 'Sarah\'nın ilk girişimini bir fikirden başarıya dönüştürme yolculuğunu takip edin'
      },
      slug: 'the-startup-journey',
      content: {
        en: [
          'Sarah had always dreamed of starting her own business.',
          'She had an idea for an app that would help people learn languages.',
          'With just $1000 in savings, she began her journey.',
          'The first few months were challenging.',
          'She worked 16-hour days, learning to code and design.',
          'Slowly, her app began to take shape.',
          'After a year of hard work, she launched her product.',
          'Today, her app has millions of users worldwide.'
        ],
        tr: [
          'Sarah her zaman kendi işini kurma hayali kurmuştu.',
          'İnsanların dil öğrenmesine yardımcı olacak bir uygulama fikri vardı.',
          'Sadece 1000 dolarlık birikimi ile yolculuğuna başladı.',
          'İlk birkaç ay zordu.',
          'Günde 16 saat çalışarak kodlama ve tasarım öğrendi.',
          'Yavaş yavaş uygulaması şekillenmeye başladı.',
          'Bir yıllık sıkı çalışmanın ardından ürününü piyasaya sürdü.',
          'Bugün uygulamasının dünya çapında milyonlarca kullanıcısı var.'
        ]
      },
      status: StoryStatus.PUBLISHED,
      statistics: {
        wordCount: { en: 97, tr: 89 },
        charCount: { en: 498, tr: 512 },
        estimatedReadingTime: { en: 1, tr: 1 }
      },
      editorRating: 4.7,
      averageRating: 4.7,
      ratingCount: 1,
      publishedAt: new Date(),
      createdBy: editor.id
    }
  });

  // Create story-category relationships
  console.log('🔗 Creating story-category relationships...');
  await Promise.all([
    prisma.storyCategory.upsert({
      where: { storyId_categoryId: { storyId: story1.id, categoryId: categories[0].id } },
      update: {},
      create: { storyId: story1.id, categoryId: categories[0].id }
    }),
    prisma.storyCategory.upsert({
      where: { storyId_categoryId: { storyId: story2.id, categoryId: categories[1].id } },
      update: {},
      create: { storyId: story2.id, categoryId: categories[1].id }
    }),
    prisma.storyCategory.upsert({
      where: { storyId_categoryId: { storyId: story3.id, categoryId: categories[2].id } },
      update: {},
      create: { storyId: story3.id, categoryId: categories[2].id }
    })
  ]);

  // Create story-tag relationships
  console.log('🏷️ Creating story-tag relationships...');
  await Promise.all([
    prisma.storyTag.upsert({
      where: { storyId_tagId: { storyId: story1.id, tagId: tags[0].id } },
      update: {},
      create: { storyId: story1.id, tagId: tags[0].id }
    }),
    prisma.storyTag.upsert({
      where: { storyId_tagId: { storyId: story1.id, tagId: tags[3].id } },
      update: {},
      create: { storyId: story1.id, tagId: tags[3].id }
    }),
    prisma.storyTag.upsert({
      where: { storyId_tagId: { storyId: story2.id, tagId: tags[1].id } },
      update: {},
      create: { storyId: story2.id, tagId: tags[1].id }
    }),
    prisma.storyTag.upsert({
      where: { storyId_tagId: { storyId: story3.id, tagId: tags[2].id } },
      update: {},
      create: { storyId: story3.id, tagId: tags[2].id }
    }),
    prisma.storyTag.upsert({
      where: { storyId_tagId: { storyId: story3.id, tagId: tags[4].id } },
      update: {},
      create: { storyId: story3.id, tagId: tags[4].id }
    })
  ]);

  // Create story-author relationships
  console.log('✍️ Creating story-author relationships...');
  await Promise.all([
    prisma.storyAuthor.upsert({
      where: { storyId_authorId: { storyId: story1.id, authorId: authors[0].id } },
      update: {},
      create: { storyId: story1.id, authorId: authors[0].id, role: 'author' }
    }),
    prisma.storyAuthor.upsert({
      where: { storyId_authorId: { storyId: story2.id, authorId: authors[1].id } },
      update: {},
      create: { storyId: story2.id, authorId: authors[1].id, role: 'author' }
    }),
    prisma.storyAuthor.upsert({
      where: { storyId_authorId: { storyId: story3.id, authorId: authors[0].id } },
      update: {},
      create: { storyId: story3.id, authorId: authors[0].id, role: 'author' }
    })
  ]);

  // Create story-series relationships
  console.log('📚 Creating story-series relationships...');
  await Promise.all([
    prisma.storySeries.upsert({
      where: { storyId_seriesId: { storyId: story1.id, seriesId: series[0].id } },
      update: {},
      create: { storyId: story1.id, seriesId: series[0].id, orderInSeries: 1 }
    }),
    prisma.storySeries.upsert({
      where: { storyId_seriesId: { storyId: story2.id, seriesId: series[1].id } },
      update: {},
      create: { storyId: story2.id, seriesId: series[1].id, orderInSeries: 1 }
    })
  ]);

  // Create sample user ratings
  console.log('⭐ Creating sample ratings...');
  await Promise.all([
    prisma.userStoryRating.upsert({
      where: { userId_storyId: { userId: regularUser.id, storyId: story1.id } },
      update: {},
      create: {
        userId: regularUser.id,
        storyId: story1.id,
        rating: 4.5
      }
    }),
    prisma.userStoryRating.upsert({
      where: { userId_storyId: { userId: regularUser.id, storyId: story2.id } },
      update: {},
      create: {
        userId: regularUser.id,
        storyId: story2.id,
        rating: 4.0
      }
    }),
    prisma.userStoryRating.upsert({
      where: { userId_storyId: { userId: admin.id, storyId: story3.id } },
      update: {},
      create: {
        userId: admin.id,
        storyId: story3.id,
        rating: 4.7
      }
    })
  ]);

  // Create sample reading progress
  console.log('📖 Creating sample reading progress...');
  await Promise.all([
    prisma.userReadingProgress.upsert({
      where: { userId_storyId: { userId: regularUser.id, storyId: story1.id } },
      update: {},
      create: {
        userId: regularUser.id,
        storyId: story1.id,
        status: 'COMPLETED',
        lastParagraph: 6,
        completedAt: new Date()
      }
    }),
    prisma.userReadingProgress.upsert({
      where: { userId_storyId: { userId: regularUser.id, storyId: story2.id } },
      update: {},
      create: {
        userId: regularUser.id,
        storyId: story2.id,
        status: 'STARTED',
        lastParagraph: 3
      }
    }),
    prisma.userReadingProgress.upsert({
      where: { userId_storyId: { userId: admin.id, storyId: story3.id } },
      update: {},
      create: {
        userId: admin.id,
        storyId: story3.id,
        status: 'COMPLETED',
        lastParagraph: 7,
        completedAt: new Date()
      }
    })
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n🔑 Default users created:');
  console.log('Admin: admin@storylibrary.com / admin123');
  console.log('Editor: editor@storylibrary.com / editor123');
  console.log('User: user@storylibrary.com / user123');
  console.log('\n📊 Summary:');
  console.log(`- ${categories.length} categories created`);
  console.log(`- ${tags.length} tags created`);
  console.log(`- ${authors.length} authors created`);
  console.log(`- ${series.length} series created`);
  console.log('- 3 sample stories created');
  console.log('- Sample ratings and reading progress added');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });