<template>
  <div class="content">
    <h2 id="what">
      What is the search widget?
    </h2>
    <p>
      The search widget is an embeddable search component on top of the GraphQL API of the Flemish Network of
      Terms. You place it on your own website or in a collection management system and get the same federated search
      as on this site:
    </p>
    <ul>
      <li>search in a selection of terminology sources you choose;</li>
      <li>
        results grouped per source, with a type badge (concept, person, organisation, place, event) and the status
        of each source (results, no results, unreachable, timed out);
      </li>
      <li>copy a term's URI and view its details;</li>
      <li>no backend of your own: the widget talks to the API directly from the browser.</li>
    </ul>

    <h2 id="quick-start">
      Quick start
    </h2>
    <p>One script tag and one element are enough. The script registers the custom element <code>&lt;vtn-search&gt;</code>.</p>
    <pre v-pre><code>&lt;script src="https://termennetwerk.meemoo.be/widget/vtn-widget.js" defer&gt;&lt;/script&gt;

&lt;vtn-search
  sources="http://vocab.getty.edu/aat,https://www.wikidata.org#vlaanderen-personen"
  lang="en"
  types="concept,person"
  limit="20"&gt;
&lt;/vtn-search&gt;</code></pre>
    <p>
      Without attributes the widget searches all MVP sources in the language of the page. Source URIs are listed on
      the
      <router-link :to="{name: 'sources'}">
        list of terminology sources
      </router-link> and returned by the API's <code>sources</code> query.
    </p>

    <h2 id="configuration">
      Configuration
    </h2>
    <p>The widget is configured with attributes on the element.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Meaning</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sources</code></td>
            <td>Comma-separated list of source URIs (as returned by the <code>sources</code> query).</td>
            <td>all MVP sources</td>
          </tr>
          <tr>
            <td><code>lang</code></td>
            <td>Interface language and preferred label language: <code>nl</code> or <code>en</code>.</td>
            <td>language of the page</td>
          </tr>
          <tr>
            <td><code>types</code></td>
            <td>Restricts results to one or more types: <code>concept</code>, <code>person</code>, <code>organization</code>, <code>place</code>, <code>event</code>.</td>
            <td>all types</td>
          </tr>
          <tr>
            <td><code>limit</code></td>
            <td>Maximum number of results per source.</td>
            <td><code>20</code></td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td>Text shown in the empty search field.</td>
            <td>translated default</td>
          </tr>
          <tr>
            <td><code>api</code></td>
            <td>GraphQL endpoint the widget queries, for example a test environment.</td>
            <td>production API</td>
          </tr>
          <tr>
            <td><code>theme</code></td>
            <td><code>light</code>, <code>dark</code> or <code>inherit</code> (follows the colours of the page).</td>
            <td><code>light</code></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>Colours are set with CSS custom properties on the element or on an ancestor:</p>
    <pre v-pre><code>vtn-search {
  --vtn-primary: #009690;
  --vtn-primary-hover: #00c8aa;
  --vtn-text: #141414;
  --vtn-bg: #ffffff;
  --vtn-font: "SofiaPro", Helvetica, Arial, sans-serif;
}</code></pre>

    <h2 id="events">
      Events
    </h2>
    <p>The widget dispatches <code>CustomEvent</code>s on the element so your application can react to what the user does.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>When</th>
            <th><code>detail</code></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>vtn:select</code></td>
            <td>The user picks a term.</td>
            <td><code>{ uri, prefLabel, source: { uri, name }, resultType, language }</code></td>
          </tr>
          <tr>
            <td><code>vtn:search</code></td>
            <td>A search is submitted.</td>
            <td><code>{ query, sources, types }</code></td>
          </tr>
          <tr>
            <td><code>vtn:error</code></td>
            <td>The API or a source returns an error.</td>
            <td><code>{ source, type, message }</code></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      The fields in <code>vtn:select</code> are the recommended set to store: URI, preferred label, source URI and
      name, type and language. An example that writes the chosen URI into a form field:
    </p>
    <pre v-pre><code>const widget = document.querySelector('vtn-search');

widget.addEventListener('vtn:select', (event) =&gt; {
  const term = event.detail;
  document.querySelector('#creator-uri').value = term.uri;
  document.querySelector('#creator-label').value = term.prefLabel;
  document.querySelector('#creator-source').value = term.source.uri;
});</code></pre>

    <h2 id="management-system">
      Integration in a collection management system
    </h2>
    <p>The recommended pattern is <strong>search, select, store</strong>:</p>
    <ol>
      <li>The user searches in the widget, for example next to the ‘Creator’ field of an object description.</li>
      <li>The user selects a term; the widget dispatches <code>vtn:select</code>.</li>
      <li>
        The application stores the URI, preferred label, source URI, type and language with the record. The URI
        is the durable reference; the label is a snapshot for display.
      </li>
      <li>
        Later, re-validate stored terms with the API's <code>lookup</code> query, for example on export or in a
        periodic check, and refresh labels the source has changed.
      </li>
    </ol>
    <p>
      Want to build the search fully into your own interface? Use the
      <a :href="apiUrl">GraphQL API</a> directly; the
      <router-link :to="{name: 'faq3'}">
        FAQ for developers
      </router-link> describes the <code>terms</code> and <code>lookup</code> queries.
    </p>

    <h2 id="security">
      Security and privacy
    </h2>
    <ul>
      <li>The widget calls the API directly from the browser; CORS is open to any origin.</li>
      <li>No cookies are set and there is no tracking; only the query and the chosen sources are sent to the API.</li>
      <li>
        Rate limits apply per IP address. If you expect heavy traffic from a single address (for example through a
        proxy), get in touch beforehand.
      </li>
      <li>The widget does not read any data from the page it is embedded in.</li>
    </ul>

    <h2 id="availability">
      Availability
    </h2>
    <p>
      The widget is part of the MVP of the Flemish Network of Terms and is in preparation. The snippet and attributes
      on this page are the planned API; small changes are possible until the first release. Feedback on the
      integration you need is welcome via
      <router-link :to="{name: 'contact'}">
        Contact
      </router-link>.
    </p>
  </div>
</template>

<script lang="ts" setup>
const apiUrl = (import.meta.env.VITE_GRAPHQL_URL as string).replace(/\/graphql$/, '/graphiql');
</script>
