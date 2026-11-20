/**
 * The integration guide: how an application (a collection management system, a website) uses the Termennetwerk,
 * step by step. Every query here is one a reader can run on the page; they are checked against the API.
 * In the texts, `backticks` mark a field or type name.
 */

export const QUERIES = {
  sources: `{
  sources(genres: ["https://termennetwerk.meemoo.be/genres/persoon"]) {
    uri
    name
    genres { uri name }
    inLanguage
    features { type }
    status { isAvailable }
  }
}`,
  terms: `{
  terms(
    sources: [
      "https://data.rkd.nl/rkdartists"
      "https://www.wikidata.org#vlaanderen-personen"
    ]
    query: "Permeke"
    genres: ["https://termennetwerk.meemoo.be/genres/persoon"]
    limit: 3
  ) {
    source { uri name }
    responseTimeMs
    result {
      __typename
      ... on Terms {
        terms { uri prefLabel altLabel scopeNote resultType seeAlso }
      }
      ... on Error { message }
    }
  }
}`,
  languages: `{
  terms(
    sources: ["http://vocab.getty.edu/tgn"]
    query: "Ypres"
    languages: [nl, fr]
    limit: 2
  ) {
    source { name inLanguage }
    result {
      __typename
      ... on TranslatedTerms {
        terms { uri prefLabel { language value } altLabel { language value } }
      }
      ... on Error { message }
    }
  }
}`,
  lookup: `{
  lookup(
    uris: [
      "https://data.rkd.nl/artists/89578"
      "https://example.org/onbekend"
    ]
  ) {
    uri
    source {
      __typename
      ... on Source { uri name }
      ... on Error { message }
    }
    result {
      __typename
      ... on Term { uri prefLabel resultType }
      ... on Error { message }
    }
  }
}`,
  timeout: `{
  terms(
    sources: [
      "https://data.rkd.nl/rkdartists"
      "https://stad.gent/id/conceptscheme/concept"
    ]
    query: "Rubens"
    timeoutMs: 1
  ) {
    source { name }
    result {
      __typename
      ... on Error { message }
    }
  }
}`,
};

export const STORED_TERM = `{
  "uri": "https://data.rkd.nl/artists/89578",
  "label": "Permeke, Henri Louis",
  "language": "nl",
  "source": "https://data.rkd.nl/rkdartists",
  "type": "PERSON"
}`;

export interface Step {
  id: string;
  title: string;
  text: string[];
  /** A query to run on the page. */
  query?: keyof typeof QUERIES;
  /** Something to read, not to run. */
  sample?: string;
  list?: string[];
}

export interface Guide {
  title: string;
  lead: string;
  address: string;
  steps: Step[];
  widgetTitle: string;
  widgetText: string;
  widgetLink: string;
  stableTitle: string;
  stableLead: string;
  stable: string[];
}

export const GUIDE: Record<'nl' | 'en', Guide> = {
  nl: {
    title: 'Integratiegids',
    lead: 'Zo koppel je een collectiebeheersysteem of website aan het Vlaams Termennetwerk. Zeven stappen, elk met een voorbeeld dat je hier meteen kunt uitvoeren.',
    address: 'Alle vragen gaan als GraphQL naar één adres. Je stuurt een POST met JSON; op deze testomgeving heb je geen sleutel nodig, en elke website mag de API aanroepen.',
    steps: [
      {
        id: 'bronnen',
        title: 'Per veld de bronnen kiezen',
        text: [
          'Vraag de lijst van bronnen op en bepaal per registratieveld waarin gezocht wordt: ‘vervaardiger’ in bronnen met personen, ‘plaats’ in bronnen met plaatsen. Een type is een genre: met `genres` krijg je alleen de bronnen van dat type, hier personen.',
          'Elke bron zegt zelf welke genres (`genres`) en talen (`inLanguage`) ze levert, wat ze kan (`features`) en of ze bereikbaar is. Bewaar per veld de URI’s van de gekozen bronnen.',
        ],
        query: 'sources',
      },
      {
        id: 'zoeken',
        title: 'Zoeken',
        text: [
          'Stuur de zoekterm samen met de bronnen van dat veld. Met `genres` geef je ook hier het type mee: een bron die types mengt, zoals RKDartists, geeft dan alleen haar personen terug. Zo’n bron herken je aan `GENRE_FILTER` in `features`. Met `limit` beperk je het aantal resultaten per bron.',
        ],
        query: 'terms',
      },
      {
        id: 'talen',
        title: 'Talen',
        text: [
          'Met `languages` vraag je de namen in de talen die je wilt tonen. Elk label komt dan terug met zijn taal (`language`) en zijn tekst (`value`); welke talen een bron levert, staat in `inLanguage`. Zonder `languages` krijg je gewone tekst, in het Nederlands en anders in het Engels.',
          'Het Termennetwerk vertaalt niets. Heeft een term geen naam in een van de gevraagde talen, dan krijg je de naam die bij de bron zonder taal staat, gemarkeerd als Nederlands, en anders een lege `prefLabel`. Vraag daarom een terugvaltaal mee, zoals Nederlands of Engels, en toon de taal bij een naam in een andere taal dan die van je scherm.',
        ],
        query: 'languages',
      },
      {
        id: 'kiezen',
        title: 'Laten kiezen',
        text: [
          'Je krijgt één antwoord per bron, voor elke bron in dezelfde vorm. Toon de resultaten in je eigen scherm, met de naam van de bron erbij, en laat de gebruiker kiezen.',
        ],
        list: [
          '`prefLabel`: de naam van de term',
          '`altLabel`: alternatieve namen',
          '`scopeNote`: de beschrijving',
          '`resultType`: concept, persoon, organisatie, plaats of gebeurtenis',
          '`seeAlso`: een pagina over de term bij de bron zelf',
        ],
      },
      {
        id: 'bewaren',
        title: 'Bewaren',
        text: [
          'Bewaar van de gekozen term minstens de URI: dat is de duurzame identifier. Bewaar daarnaast het label met zijn taal, de bron en het type, zodat je ze kunt tonen zonder opnieuw te vragen.',
        ],
        sample: STORED_TERM,
      },
      {
        id: 'opzoeken',
        title: 'Opnieuw opzoeken',
        text: [
          'Met een bewaarde URI vraag je later de actuele gegevens op. Het Termennetwerk zoekt zelf uit bij welke bron de URI hoort.',
          'In het voorbeeld is de tweede URI onbekend: zo zie je hoe dat gemeld wordt.',
        ],
        query: 'lookup',
      },
      {
        id: 'fouten',
        title: 'Fouten verwerken',
        text: [
          'Een fout bij één bron breekt het antwoord niet: de andere bronnen leveren gewoon hun resultaten. Lees per bron het veld `__typename`.',
          'In het voorbeeld krijgen de bronnen met opzet maar één milliseconde.',
        ],
        list: [
          '`Terms`: resultaten; een lege lijst is geen fout',
          '`TimeoutError`: de bron antwoordde niet op tijd',
          '`ServerError`: de bron is niet bereikbaar of gaf zelf een fout',
          '`NotFoundError` (bij opzoeken): de URI bestaat niet in de bron',
          '`SourceNotFoundError` (bij opzoeken): geen enkele bron kent deze URI',
        ],
        query: 'timeout',
      },
    ],
    widgetTitle: 'Liever geen eigen scherm bouwen?',
    widgetText: 'De zoekwidget doet deze stappen in één HTML-tag en geeft de gekozen term terug als gebeurtenis.',
    widgetLink: 'Naar de zoekwidget',
    stableTitle: 'Stabiele API',
    stableLead: 'Een koppeling die vandaag werkt, moet blijven werken. Daar houden we de API aan:',
    stable: [
      'Er komen velden bij, er verdwijnen er geen.',
      'Wat verouderd is, blijft bestaan en staat in de beschrijving van de API als verouderd gemarkeerd. Voorbeeld: het oude veld `terms` naast het nieuwe `result`.',
      'De acceptatietests bewaken dat, met een eigen test voor die oude manier van opvragen (API-37).',
      'Fouten hebben vaste namen: `TimeoutError`, `ServerError`, `NotFoundError` en `SourceNotFoundError`.',
    ],
  },
  en: {
    title: 'Integration guide',
    lead: 'How to connect a collection management system or website to the Vlaams Termennetwerk. Seven steps, each with an example you can run right here.',
    address: 'Every question goes as GraphQL to one address. You send a POST with JSON; this test environment needs no key, and any website may call the API.',
    steps: [
      {
        id: 'bronnen',
        title: 'Choose the sources per field',
        text: [
          'Fetch the list of sources and decide per cataloguing field where to search: ‘maker’ in sources with persons, ‘place’ in sources with places. A type is a genre: `genres` returns only the sources of that type, here persons.',
          'Each source states which genres (`genres`) and languages (`inLanguage`) it offers, what it can do (`features`) and whether it is reachable. Keep the URIs of the chosen sources per field.',
        ],
        query: 'sources',
      },
      {
        id: 'zoeken',
        title: 'Search',
        text: [
          'Send the search term together with the sources of that field. `genres` passes the type here too: a source that mixes types, such as RKDartists, then returns only its persons. Such a source has `GENRE_FILTER` among its `features`. `limit` caps the results per source.',
        ],
        query: 'terms',
      },
      {
        id: 'talen',
        title: 'Languages',
        text: [
          '`languages` asks for the names in the languages you want to show. Each label then comes back with its language (`language`) and its text (`value`); `inLanguage` says which languages a source offers. Without `languages` you get plain text, in Dutch and otherwise in English.',
          'The Termennetwerk translates nothing. When a term has no name in any of the requested languages, you get the name the source holds without a language, marked as Dutch, and otherwise an empty `prefLabel`. So also ask for a language to fall back on, such as Dutch or English, and show the language beside a name that is in another language than your screen.',
        ],
        query: 'languages',
      },
      {
        id: 'kiezen',
        title: 'Let the user choose',
        text: [
          'You get one answer per source, in the same shape for every source. Show the results in your own screen, with the name of the source, and let the user pick.',
        ],
        list: [
          '`prefLabel`: the name of the term',
          '`altLabel`: alternative names',
          '`scopeNote`: the description',
          '`resultType`: concept, person, organization, place or event',
          '`seeAlso`: a page about the term at the source itself',
        ],
      },
      {
        id: 'bewaren',
        title: 'Store',
        text: [
          'Of the chosen term, store at least the URI: that is the durable identifier. Also store the label with its language, the source and the type, so you can show them without asking again.',
        ],
        sample: STORED_TERM,
      },
      {
        id: 'opzoeken',
        title: 'Look up again',
        text: [
          'With a stored URI you fetch the current data later. The Termennetwerk works out itself which source the URI belongs to.',
          'In the example the second URI is unknown, to show how that is reported.',
        ],
        query: 'lookup',
      },
      {
        id: 'fouten',
        title: 'Handle errors',
        text: [
          'An error at one source does not break the answer: the other sources still deliver their results. Read the field `__typename` per source.',
          'In the example the sources deliberately get one millisecond only.',
        ],
        list: [
          '`Terms`: results; an empty list is not an error',
          '`TimeoutError`: the source did not answer in time',
          '`ServerError`: the source is unreachable or returned an error itself',
          '`NotFoundError` (on lookup): the URI does not exist in the source',
          '`SourceNotFoundError` (on lookup): no source knows this URI',
        ],
        query: 'timeout',
      },
    ],
    widgetTitle: 'Rather not build your own screen?',
    widgetText: 'The search widget does these steps in one HTML tag and returns the chosen term as an event.',
    widgetLink: 'To the search widget',
    stableTitle: 'Stable API',
    stableLead: 'An integration that works today has to keep working. This is what we hold the API to:',
    stable: [
      'Fields are added, none are removed.',
      'What is outdated stays and is marked as deprecated in the description of the API. Example: the old field `terms` beside the new `result`.',
      'The acceptance tests guard this, with a test of their own for that old way of asking (API-37).',
      'Errors have fixed names: `TimeoutError`, `ServerError`, `NotFoundError` and `SourceNotFoundError`.',
    ],
  },
};
