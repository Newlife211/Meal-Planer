import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UseCaseView } from '@/components/use-case-view';
import { getSiteUrl } from '@/lib/seo/site';
import { getUseCase, ALL_PLAN_SLUGS } from '@/lib/content/use-cases';
import { getRecipe } from '@/lib/content/recipes';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return ALL_PLAN_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const uc = getUseCase('en', params.slug);
  if (!uc) {
    return { title: 'Meal plan not found — Eatwise' };
  }
  return {
    title: `${uc.title} — Eatwise`,
    description: uc.subtitle,
    alternates: { canonical: `/meal-plans/${uc.slug}` },
    openGraph: {
      title: uc.title,
      description: uc.subtitle,
      type: 'website',
    },
  };
}

export default function UseCasePage({ params }: { params: { slug: string } }) {
  const uc = getUseCase('en', params.slug);
  if (!uc) {
    notFound();
  }

  const site = getSiteUrl();
  const recipe = getRecipe('en', params.slug);
  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${site}/meal-plans/${uc.slug}#faq`,
      mainEntity: uc.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site },
        { '@type': 'ListItem', position: 2, name: 'Meal plans', item: `${site}/meal-plans` },
        { '@type': 'ListItem', position: 3, name: uc.title, item: `${site}/meal-plans/${uc.slug}` },
      ],
    },
  ];

  if (recipe) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      '@id': `${site}/meal-plans/${uc.slug}#recipe`,
      name: recipe.name,
      description: recipe.description,
      author: { '@type': 'Organization', name: 'Eatwise' },
      recipeYield: `${recipe.servings} servings`,
      prepTime: `PT${recipe.prepMin}M`,
      cookTime: `PT${recipe.cookMin}M`,
      totalTime: `PT${recipe.prepMin + recipe.cookMin}M`,
      recipeIngredient: recipe.ingredients,
      recipeInstructions: recipe.steps.map((s) => ({ '@type': 'HowToStep', text: s })),
      nutrition: {
        '@type': 'NutritionInformation',
        calories: `${recipe.kcal} kcal`,
        proteinContent: `${recipe.protein} g`,
        carbohydrateContent: `${recipe.carbs} g`,
        fatContent: `${recipe.fat} g`,
        servingSize: '1 serving',
      },
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UseCaseView slug={params.slug} />
    </>
  );
}
