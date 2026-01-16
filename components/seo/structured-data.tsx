export function StructuredData() {
  const siteUrl = "https://sdakawangwangware.site";

  const churchSchema = {
    "@context": "https://schema.org",
    "@type": "Church",
    "@id": `${siteUrl}/#church`,
    name: "Seventh-Day Adventist Church Kawangware",
    alternateName: "SDA Church Kawangware",
    description:
      "A Seventh-Day Adventist church in Kawangware, Nairobi, Kenya. Join us for Sabbath worship services, Bible study, devotionals, and community events.",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/og-image.jpg`,
    telephone: "+254-XXX-XXX-XXX",
    email: "info@sdakawangware.org",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kawangware",
      addressLocality: "Nairobi",
      addressRegion: "Nairobi County",
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -1.2731,
      longitude: 36.7468,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "13:00",
        description: "Sabbath Worship Service",
      },
    ],
    sameAs: [
      "https://www.facebook.com/sdakawangware",
      "https://www.youtube.com/@sdakawangware",
    ],
    priceRange: "Free",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Church Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Sabbath Worship Service",
            description: "Weekly Sabbath worship service with praise, prayer, and sermon",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Bible Study",
            description: "Weekly Bible study sessions for spiritual growth",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Online Giving",
            description: "Secure online platform for tithes and offerings",
          },
        },
      ],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "SDA Church Kawangware",
    description:
      "Official website of Seventh-Day Adventist Church Kawangware - Sabbath worship, devotionals, events, and online giving.",
    publisher: {
      "@id": `${siteUrl}/#church`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?s={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-KE",
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Seventh-Day Adventist Church Kawangware",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
      width: 512,
      height: 512,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "info@sdakawangware.org",
      availableLanguage: ["English", "Swahili"],
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(churchSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
