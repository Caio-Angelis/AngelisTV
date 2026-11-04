const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let channels = [];
let lockedChannel = null;
let lockState = false;

function parseM3U(content) {
  const lines = content.split('\n');
  const parsed = [];
  let currentChannel = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF')) {
      const nameMatch = trimmed.match(/,(.+)$/);
      if (nameMatch) {
        currentChannel = {
          name: nameMatch[1].trim(),
          logo: '',
          group: '',
          url: ''
        };
        const idMatch = trimmed.match(/tvg-id="([^"]*)"/);
        const logoMatch = trimmed.match(/tvg-logo="([^"]*)"/);
        const groupMatch = trimmed.match(/group-title="([^"]*)"/);
        if (idMatch) currentChannel.id = idMatch[1];
        if (logoMatch) currentChannel.logo = logoMatch[1];
        if (groupMatch) currentChannel.group = groupMatch[1];
      }
    } else if (trimmed && !trimmed.startsWith('#') && currentChannel) {
      currentChannel.url = trimmed;
      parsed.push(currentChannel);
      currentChannel = null;
    }
  }

  return parsed;
}

async function fetchM3U(url) {
  const response = await fetch(url);
  const content = await response.text();
  return parseM3U(content);
}

async function loadChannels() {
  try {
    const channelLists = [
      'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/CanaisIPTV.m3u8',
      'https://raw.githubusercontent.com/Ramys/Iptv-Brasil-2026/master/Canais.m3u8'
    ];

    for (const url of channelLists) {
      try {
        const fetched = await fetchM3U(url);
        if (fetched.length > 0) {
          channels = fetched;
          console.log(`Loaded ${channels.length} channels from ${url}`);
          break;
        }
      } catch (e) {
        console.log(`Failed to load ${url}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Error loading channels:', e);
  }
}

app.get('/api/channels', (req, res) => {
  res.json(channels);
});

app.post('/api/lock', (req, res) => {
  const { channelId } = req.body;
  const channel = channels.find(c => c.name === channelId);
  if (channel) {
    lockedChannel = channel;
    lockState = true;
    console.log(`Locked to channel: ${channel.name}`);
    res.json({ success: true, channel: lockedChannel });
  } else {
    res.status(404).json({ error: 'Channel not found' });
  }
});

app.post('/api/unlock', (req, res) => {
  lockState = false;
  lockedChannel = null;
  console.log('Channel unlocked');
  res.json({ success: true, locked: false });
});

app.get('/api/status', (req, res) => {
  res.json({ locked: lockState, lockedChannel: lockedChannel || null });
});

app.get('/stream', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  const proxyUrl = url;
  const request = require('http').request;
  const https = require('https');

  const client = url.startsWith('https') ? https : request;

  const proxyReq = client.request(proxyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  }, (proxyRes) => {
    res.status(proxyRes.statusCode);
    res.set('Content-Type', proxyRes.headers['content-type'] || 'video/mp2t');
    proxyRes.pipe(res);
  }).on('error', (e) => {
    res.status(502).json({ error: 'Stream proxy error', details: e.message });
  });

  proxyReq.end();
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  loadChannels();
});
