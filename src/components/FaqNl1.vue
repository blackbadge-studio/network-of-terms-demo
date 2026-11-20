<template>
  <div class="content">
    <h3>
      Wat zijn termen?
    </h3>
    <p>
      Termen beschrijven waar erfgoed over gaat. Termen zijn bijvoorbeeld onderwerpen, personen of plaatsen. Neem De
      Nachtwacht: het is een ‘schilderij’, vervaardigd door ‘Rembrandt’ in ‘Amsterdam’.
    </p>
    <p>
      Toch is een term meer dan een woord. Elke term heeft namelijk een identifier, een zogeheten
      <a href="https://nl.wikipedia.org/wiki/Uniform_resource_identifier">URI</a>. Een URI is een uniek adres
      waardoor ondubbelzinnig duidelijk is welke term bedoeld wordt. Bijvoorbeeld de term ‘noodweer’: wordt hier het
      juridische concept bedoeld of een bepaalde weersgesteldheid? De betekenis wordt duidelijk als je de URI van de
      term gebruikt, zoals <a href="http://www.wikidata.org/entity/Q741507">http://www.wikidata.org/entity/Q741507</a>.
    </p>
    <p>
      Daarnaast kan een term extra informatie bevatten, zoals een definitie of een alternatieve benaming. Bijvoorbeeld
      de term ‘schilderij’ met de URI <a href="http://vocab.getty.edu/aat/300177435">http://vocab.getty.edu/aat/300177435</a>.
      De extra informatie over deze term maakt duidelijk dat het een synoniem heeft, ‘schilderstuk’.
    </p>

    <h3>
      Waarom zijn termen belangrijk?
    </h3>
    <p>
      Termen stellen gebruikers – zoals leerlingen, journalisten of wetenschappers – in staat om erfgoed op het web
      beter te vinden. Bijvoorbeeld: als een gebruiker enkel zoekt naar het <em>woord</em> ‘schilderij’, vindt hij
      alleen het erfgoed waarin dit woord voorkomt, niet het erfgoed met het synoniem ‘schilderstuk’. Maar als een
      gebruiker zoekt naar de <em>term</em> ‘schilderij’, vindt hij ook het erfgoed waarin ‘schilderstuk’ voorkomt.
      Gebruik van termen zorgt dus voor betere vindbaarheid.
    </p>

    <a id="terminology-source" />
    <h3>
      Wat zijn terminologiebronnen?
    </h3>
    <p>
      Termen worden beheerd in terminologiebronnen, zoals thesauri, referentielijsten of classificatiesystemen. Zo
      zijn er bronnen met informatie over plaatsen, zoals <a href="https://www.geonames.org/">GeoNames</a>, en bronnen
      met informatie over personen, zoals <a href="https://rkd.nl/nl/explore/artists">RKDartists</a>. Ook zijn er
      algemene bronnen met informatie over allerlei onderwerpen, zoals <a href="https://www.wikidata.org/">Wikidata</a>,
      en specifieke bronnen met informatie over gerichte onderwerpen, zoals
      de <a href="https://vtmk.data.momu.be/id.html">Visuele Thesaurus voor Mode en Kostuums</a>.
    </p>

    <h3>
      Waarom zijn terminologiebronnen belangrijk?
    </h3>
    <p>
      Termen zijn niet zomaar wat begrippen: het zijn officiële aanduidingen. De beheerders van terminologiebronnen
      staan in voor de kwaliteit ervan. Bijvoorbeeld inhoudelijk: termen moeten accuraat en actueel zijn. Maar ook wat
      betreft de houdbaarheid: beheerders zorgen ervoor dat hun termen duurzaam beschikbaar zijn en voor lange tijd
      gebruikt kunnen worden.
    </p>

    <a id="what-is" />
    <h3>
      Wat is het Termennetwerk?
    </h3>
    <p>
      Het Termennetwerk is een zoekmachine voor termen. Je voert er een zoekvraag in – zoals ‘Rubens’ – en het
      Termennetwerk zoekt vervolgens rechtstreeks, realtime in terminologiebronnen naar overeenkomende termen. Uit de
      termen die dit oplevert kun je een keuze maken. Bijvoorbeeld ‘Pieter Paul Rubens’ in Wikidata of ‘Rubens,
      Arnold Frans’ in RKDartists.
    </p>

    <h3>
      Waarom is het Termennetwerk belangrijk?
    </h3>
    <p>
      Het Termennetwerk maakt het eenvoudiger om te zoeken in terminologiebronnen. Een collectiebeheerder hoeft enkel
      het Termennetwerk te raadplegen, niet meer de individuele bronnen. En een ontwikkelaar van erfgoedsoftware hoeft
      enkel te koppelen met het Termennetwerk, niet meer met de individuele bronnen. Dit scheelt tijd en geld.
    </p>

    <h3>
      Hoe kan ik het Termennetwerk gebruiken?
    </h3>
    <p>
      Je gebruikt het Termennetwerk in je collectiebeheersysteem. Je hoeft dus niet tussen beide te <em>switchen</em>.
      Hoe je het Termennetwerk precies kunt gebruiken, ligt aan de mogelijkheden die de leverancier van je systeem
      biedt. Dat kan er bijvoorbeeld als volgt uitzien:
    </p>
    <p>
      Stel, je bent in je systeem bezig met het beschrijven van een erfgoedobject, zoals De Nachtwacht. Bij het veld
      ‘Vervaardiger’ wil je aangeven wie de maker van het object is. Daartoe voer je in het veld een zoekvraag in,
      zoals ‘Rembrandt’, en geef je aan in welke terminologiebron je wilt zoeken, zoals RKDartists. Vervolgens stuurt
      het collectiebeheersysteem deze informatie naar het Termennetwerk. Het Termennetwerk antwoordt daarop met termen
      die voldoen aan de zoekvraag. Het collectiebeheersysteem toont jou de antwoorden in een lijst. Je kiest daarna
      de term die het beste past. Onder water, onzichtbaar, slaat het collectiebeheersysteem de identifier – de URI –
      van de gekozen term op, zoals <a href="https://data.rkd.nl/artists/66219">https://data.rkd.nl/artists/66219</a>.
      Daarmee is er een link gelegd tussen jouw erfgoedobject en de terminologiebron.
    </p>

    <h3>
      Hoe kan ik het Termennetwerk uitproberen?
    </h3>
    <p>
      Op deze website. Op de <router-link :to="{name: 'home'}">
        zoekpagina
      </router-link> vul je bovenaan je zoekvraag in en kies je in welke terminologiebron of -bronnen je wilt zoeken.
      Als je klikt op de knop <em>Zoeken</em> wordt je zoekvraag verwerkt. Onderaan de pagina verschijnen vervolgens
      de termen die gevonden zijn in de terminologiebronnen.
    </p>
    <p>
      Deze website laat zien wat het Termennetwerk kan. In de praktijk gebruik je het vanuit je
      collectiebeheersysteem.
    </p>

    <h3>
      Wie maakt en beheert het Termennetwerk?
    </h3>
    <p>
      Het Vlaams Termennetwerk wordt een dienst van meemoo, het Vlaams instituut voor het archief. Het bouwt voort
      op de open broncode van het Nederlandse Termennetwerk, gemaakt door het Netwerk Digitaal Erfgoed. Deze
      testomgeving is een proof of concept van Black Badge Studio.
    </p>

    <h3>
      Kan ik het Termennetwerk al gebruiken?
    </h3>
    <p>
      Uitproberen kan nu al, maar dit is een testomgeving: bronnen en functies kunnen nog veranderen. We horen
      graag wat je ervan vindt. Bijvoorbeeld: zijn de zoekmogelijkheden toereikend? Zijn de zoekresultaten bruikbaar?
    </p>
    <p>
      Zodra het Vlaams Termennetwerk in productie is, kan je leverancier het in je collectiebeheersysteem inbouwen.
    </p>

    <h3>
      Hoe zijn de zoekresultaten gesorteerd?
    </h3>
    <p>
      Wanneer een terminologiebron zoekresultaten op relevantie kan sorteren, neemt het Termennetwerk die volgorde over.
      De relevantste resultaten staan dan bovenaan.
    </p>
    <p>
      Resultaten uit terminologiebronnen die geen ondersteuning bieden voor relevantie, worden (bij gebrek aan beter)
      alfabetisch weergegeven.
    </p>

    <h3>
      Ik wil een bepaalde terminologiebron gebruiken, maar die komt niet voor in het Termennetwerk.
      Kan die toegevoegd worden?
    </h3>
    <p>
      Laat ons weten welke bron het is en we kijken er graag naar. We gaan onderzoeken of de bron aan een aantal
      voorwaarden voldoet. Zo moet de bron als ‘open data’ beschikbaar zijn, bepaalde metadatastandaarden gebruiken en
      bepaalde zoekmogelijkheden bieden. Als de bron hier niet aan voldoet, dient de beheerder zijn bron eerst aan te
      passen voordat deze kan worden toegevoegd aan het Termennetwerk.
    </p>

    <a id="ServerError" />
    <h3>
      Ik krijg een foutmelding: “{{ t('api.ServerError') }}”. Wat betekent dit?
    </h3>
    <p>
      Het Termennetwerk zoekt rechtstreeks (realtime) in <a href="#terminology-source">terminologiebronnen</a>.
      Wanneer een terminologiebron niet bereikbaar is,
      bijvoorbeeld door een storing of onderhoud bij de aanbieder van de bron,
      kan het Termennetwerk geen zoekresultaten leveren.
      Probeer je zoekopdracht later opnieuw.
      Mocht het probleem dan nog steeds optreden, kun je dat melden bij de
      <router-link
        :to="{name: 'sources'}"
      >
        aanbieder van de bron
      </router-link>.
    </p>

    <a id="TimeoutError" />
    <h3>
      Ik krijg een foutmelding: “{{ t('api.TimeoutError') }}”. Wat betekent dit?
    </h3>
    <p>
      Het Termennetwerk zoekt rechtstreeks (realtime) in
      <a href="#terminology-source">terminologiebronnen</a>.
      Soms reageert een terminologie traag, bijvoorbeeld door drukte.
      Wanneer een bron te lang over een antwoord doet, stopt het Termennetwerk met wachten en toont deze foutmelding.
      Probeer je zoekopdracht later opnieuw of neem contact op met de
      <router-link
        :to="{name: 'sources'}"
      >
        aanbieder van de bron
      </router-link>.
    </p>

    <h3>
      Ik heb een vraag, probleem of wens. Met wie kan ik contact opnemen?
    </h3>
    <p>
      Dit is een testomgeving. Gebruik de feedbackknop rechtsonder op elke pagina: je opmerking komt met de pagina
      en een schermafbeelding bij de bouwers terecht.
    </p>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {useI18n} from 'vue-i18n';

export default defineComponent({
  name: 'FaqNl1',
  setup() {
    const {t} = useI18n();
    return {t};
  },
});
</script>
