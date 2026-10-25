<template>
  <div class="content">
    <h2 id="wat">
      Wat is de zoekwidget?
    </h2>
    <p>
      De zoekwidget is een inbedbare zoekcomponent bovenop de GraphQL API van het Vlaams Termennetwerk. Je plaatst
      hem op een eigen website of in een collectiebeheersysteem en krijgt daar dezelfde federatieve zoekfunctie als op
      deze site:
    </p>
    <ul>
      <li>zoeken in een door jou gekozen selectie van terminologiebronnen;</li>
      <li>
        resultaten gegroepeerd per bron, met een type-badge (concept, persoon, organisatie, plaats, gebeurtenis) en
        de status van elke bron (resultaten, geen resultaten, niet bereikbaar, time-out);
      </li>
      <li>URI kopiëren en details van een term bekijken;</li>
      <li>geen eigen backend nodig: de widget praat rechtstreeks vanuit de browser met de API.</li>
    </ul>

    <h2 id="snelle-start">
      Snelle start
    </h2>
    <p>Eén script-tag en één element volstaan. Het script registreert het custom element <code>&lt;vtn-search&gt;</code>.</p>
    <pre v-pre><code>&lt;script src="https://termennetwerk.meemoo.be/widget/vtn-widget.js" defer&gt;&lt;/script&gt;

&lt;vtn-search
  sources="http://vocab.getty.edu/aat,https://www.wikidata.org#vlaanderen-personen"
  lang="nl"
  types="concept,person"
  limit="20"&gt;
&lt;/vtn-search&gt;</code></pre>
    <p>
      Zonder attributen zoekt de widget in alle MVP-bronnen, in de taal van de pagina. De bron-URI's vind je in de
      <router-link :to="{name: 'sources'}">
        lijst van terminologiebronnen
      </router-link> of via de <code>sources</code>-query van de API.
    </p>

    <h2 id="configuratie">
      Configuratie
    </h2>
    <p>De widget wordt geconfigureerd met attributen op het element.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Attribuut</th>
            <th>Betekenis</th>
            <th>Standaard</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sources</code></td>
            <td>Komma-gescheiden lijst van bron-URI's (zoals teruggegeven door de <code>sources</code>-query).</td>
            <td>alle MVP-bronnen</td>
          </tr>
          <tr>
            <td><code>lang</code></td>
            <td>Taal van de interface en voorkeurstaal van labels: <code>nl</code> of <code>en</code>.</td>
            <td>taal van de pagina</td>
          </tr>
          <tr>
            <td><code>types</code></td>
            <td>Beperkt de resultaten tot één of meer types: <code>concept</code>, <code>person</code>, <code>organization</code>, <code>place</code>, <code>event</code>.</td>
            <td>alle types</td>
          </tr>
          <tr>
            <td><code>limit</code></td>
            <td>Maximaal aantal resultaten per bron.</td>
            <td><code>20</code></td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td>Tekst in het lege zoekveld.</td>
            <td>vertaalde standaardtekst</td>
          </tr>
          <tr>
            <td><code>api</code></td>
            <td>GraphQL-endpoint dat de widget bevraagt, bijvoorbeeld een testomgeving.</td>
            <td>productie-API</td>
          </tr>
          <tr>
            <td><code>theme</code></td>
            <td><code>light</code>, <code>dark</code> of <code>inherit</code> (volgt de kleuren van de pagina).</td>
            <td><code>light</code></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>Kleuren pas je aan met CSS custom properties op het element of op een bovenliggend element:</p>
    <pre v-pre><code>vtn-search {
  --vtn-primary: #009690;
  --vtn-primary-hover: #00c8aa;
  --vtn-text: #141414;
  --vtn-bg: #ffffff;
  --vtn-font: "SofiaPro", Helvetica, Arial, sans-serif;
}</code></pre>

    <h2 id="gebeurtenissen">
      Gebeurtenissen
    </h2>
    <p>De widget stuurt <code>CustomEvent</code>s op het element, zodat je toepassing kan reageren op wat de gebruiker doet.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Wanneer</th>
            <th><code>detail</code></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>vtn:select</code></td>
            <td>De gebruiker kiest een term.</td>
            <td><code>{ uri, prefLabel, source: { uri, name }, resultType, language }</code></td>
          </tr>
          <tr>
            <td><code>vtn:search</code></td>
            <td>Een zoekopdracht wordt verstuurd.</td>
            <td><code>{ query, sources, types }</code></td>
          </tr>
          <tr>
            <td><code>vtn:error</code></td>
            <td>De API of een bron geeft een fout.</td>
            <td><code>{ source, type, message }</code></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      De velden in <code>vtn:select</code> zijn de aanbevolen set om te bewaren: URI, voorkeurslabel, bron-URI en
      -naam, type en taal. Een voorbeeld dat de gekozen URI in een formulierveld schrijft:
    </p>
    <pre v-pre><code>const widget = document.querySelector('vtn-search');

widget.addEventListener('vtn:select', (event) =&gt; {
  const term = event.detail;
  document.querySelector('#vervaardiger-uri').value = term.uri;
  document.querySelector('#vervaardiger-label').value = term.prefLabel;
  document.querySelector('#vervaardiger-bron').value = term.source.uri;
});</code></pre>

    <h2 id="beheersysteem">
      Integratie in een beheersysteem
    </h2>
    <p>Het aanbevolen patroon is <strong>zoeken, selecteren, bewaren</strong>:</p>
    <ol>
      <li>De gebruiker zoekt in de widget, bijvoorbeeld bij het veld ‘Vervaardiger’ van een objectbeschrijving.</li>
      <li>De gebruiker selecteert een term; de widget stuurt <code>vtn:select</code>.</li>
      <li>
        De toepassing bewaart URI, voorkeurslabel, bron-URI, type en taal bij het record. De URI is de duurzame
        verwijzing; het label is een momentopname voor weergave.
      </li>
      <li>
        Later valideer je bewaarde termen opnieuw met de <code>lookup</code>-query van de API, bijvoorbeeld bij een
        export of een periodieke controle, en werk je labels bij als de bron die heeft gewijzigd.
      </li>
    </ol>
    <p>
      Wil je de zoekfunctie volledig in je eigen interface bouwen? Gebruik dan rechtstreeks de
      <a :href="apiUrl">GraphQL API</a>; de
      <router-link :to="{name: 'faq3'}">
        veelgestelde vragen voor ontwikkelaars
      </router-link> beschrijven de <code>terms</code>- en <code>lookup</code>-query's.
    </p>

    <h2 id="beveiliging">
      Beveiliging en privacy
    </h2>
    <ul>
      <li>De widget roept de API rechtstreeks vanuit de browser aan; CORS staat open voor elke herkomst.</li>
      <li>Er worden geen cookies geplaatst en er is geen tracking; alleen de zoekvraag en de gekozen bronnen gaan naar de API.</li>
      <li>
        Er gelden rate limits per IP-adres. Verwacht je veel verkeer vanaf één adres (bijvoorbeeld via een proxy),
        neem dan vooraf contact op.
      </li>
      <li>De widget vraagt geen gegevens van de pagina op waarin hij staat.</li>
    </ul>

    <h2 id="roadmap">
      Beschikbaarheid
    </h2>
    <p>
      De widget maakt deel uit van de MVP van het Vlaams Termennetwerk en is in voorbereiding. De snippet en
      attributen op deze pagina zijn de geplande API; kleine wijzigingen zijn mogelijk tot de eerste release. Feedback
      over de gewenste integratie is welkom via
      <router-link :to="{name: 'contact'}">
        Contact
      </router-link>.
    </p>
  </div>
</template>

<script lang="ts" setup>
const apiUrl = (import.meta.env.VITE_GRAPHQL_URL as string).replace(/\/graphql$/, '/graphiql');
</script>
