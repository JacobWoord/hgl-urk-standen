const express = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory cache
const cache = {
  competities: { data: null, timestamp: 0 },
  standen: {} // keyed by competitieId
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// User-Agent header
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Serve static files
app.use(express.static('public'));

// GET /api/competities
app.get('/api/competities', async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (cache.competities.data && (now - cache.competities.timestamp) < CACHE_DURATION) {
      return res.json(cache.competities.data);
    }

    // Scrape biljartscore.nl
    const url = 'https://www.biljartscore.nl/hetgroenelaken/standen';
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const competities = [];
    const linkPattern = /\/hetgroenelaken\/standen\/id\/(\d+)/;
    
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && linkPattern.test(href)) {
        const match = href.match(linkPattern);
        const id = parseInt(match[1]);
        const naam = $(elem).text().trim();
        
        if (naam && !competities.some(c => c.id === id)) {
          competities.push({ id, naam });
        }
      }
    });
    
    // Update cache
    cache.competities = {
      data: competities,
      timestamp: now
    };
    
    res.json(competities);
  } catch (error) {
    console.error('Error fetching competities:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// GET /api/standen/:competitieId
app.get('/api/standen/:competitieId', async (req, res) => {
  try {
    const competitieId = req.params.competitieId;
    
    // Check cache
    const now = Date.now();
    if (cache.standen[competitieId] && (now - cache.standen[competitieId].timestamp) < CACHE_DURATION) {
      return res.json(cache.standen[competitieId].data);
    }
    
    // Scrape standings
    const url = `https://www.biljartscore.nl/hetgroenelaken/standen/id/${competitieId}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract competition name
    let competitie = '';
    $('h1, h2, h3').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && !competitie) {
        competitie = text;
      }
    });
    
    // Parse table
    const spelers = [];
    let lastPos = null;
    
    $('table').each((tableIndex, table) => {
      const headers = [];
      $(table).find('thead tr th, thead tr td').each((i, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });
      
      // Check if this is the standings table
      if (headers.includes('pos') || headers.includes('speler') || headers.includes('wed')) {
        $(table).find('tbody tr').each((i, row) => {
          const cells = $(row).find('td');
          if (cells.length === 0) return;
          
          const rowData = {};
          cells.each((cellIndex, cell) => {
            rowData[cellIndex] = $(cell).text().trim();
          });
          
          // Parse position (may be empty for shared ranks)
          const posText = rowData[0] || '';
          const pos = posText ? parseInt(posText) : lastPos;
          if (posText) lastPos = pos;
          
          // Parse player name and handicap
          const spelerCell = cells.eq(1);
          const spelerLink = spelerCell.find('a');
          const fullText = spelerLink.length ? spelerLink.text().trim() : spelerCell.text().trim();
          
          let naam = fullText;
          let handicap = null;
          
          const handicapMatch = fullText.match(/^(.+?)\s*\((\d+)\)\s*$/);
          if (handicapMatch) {
            naam = handicapMatch[1].trim();
            handicap = parseInt(handicapMatch[2]);
          }
          
          // Parse other columns
          const parseNumber = (val) => {
            if (!val || val === '-' || val === '') return null;
            const num = parseFloat(val.replace(',', '.').replace('%', ''));
            return isNaN(num) ? null : num;
          };
          
          const speler = {
            pos: pos,
            naam: naam,
            handicap: handicap,
            wed: parseNumber(rowData[2]),
            w: parseNumber(rowData[3]),
            g: parseNumber(rowData[4]),
            v: parseNumber(rowData[5]),
            pnt: parseNumber(rowData[6]),
            hs: parseNumber(rowData[7]),
            kp: parseNumber(rowData[8]),
            moyo: parseNumber(rowData[9]),
            moyn: parseNumber(rowData[10]),
            car: rowData[11] || null,
            omh: rowData[12] || null,
            roc: parseNumber(rowData[13]),
            rop: parseNumber(rowData[14]),
            rot: parseNumber(rowData[15])
          };
          
          spelers.push(speler);
        });
      }
    });
    
    const result = {
      competitie: competitie,
      laatstBijgewerkt: new Date().toISOString(),
      spelers: spelers
    };
    
    // Update cache
    cache.standen[competitieId] = {
      data: result,
      timestamp: now
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching standen:', error);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

app.listen(PORT, () => {
  console.log(`🎱 HGL Standen server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
