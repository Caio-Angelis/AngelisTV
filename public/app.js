const videoPlayer = document.getElementById('videoPlayer');
const channelList = document.getElementById('channelList');
const lockStatus = document.getElementById('lockStatus');
const channelInfo = document.getElementById('channelInfo');
let channels = [];
let locked = false;
let selectedChannel = null;
let hls = null;

async function loadChannels() {
  const response = await fetch('/api/channels');
  channels = await response.json();
  renderChannels();
}

function renderChannels() {
  channelList.innerHTML = '';
  const grouped = {};
  channels.forEach(ch => {
    const group = ch.group || 'Outros';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(ch);
  });

  Object.keys(grouped).sort().forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'channel-group';
    groupDiv.innerHTML = `<h3>${group}</h3>`;
    grouped[group].forEach(ch => {
      const item = document.createElement('div');
      item.className = 'channel-item';
      item.id = 'channel-' + channels.indexOf(ch);
      item.innerHTML = `<div class="channel-name">${ch.name}</div><div class="channel-group">${group}</div>`;
      groupDiv.appendChild(item);
    });
    channelList.appendChild(groupDiv);
  });
}

document.addEventListener('click', async function(e) {
  const item = e.target.closest('.channel-item');
  if (!item) return;

  const channelIndex = parseInt(item.id.replace('channel-', ''));
  const channel = channels[channelIndex];
  if (!channel) return;

  if (locked && selectedChannel !== channel) {
    alert('Canal bloqueado. Libere antes de selecionar outro.');
    return;
  }

  selectedChannel = channel;
  channelInfo.textContent = channel.name;

  if (!locked) {
    try {
      await fetch('/api/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.name })
      });
      locked = true;
      lockStatus.className = 'lock-status locked';
      lockStatus.textContent = 'Bloqueado';
    } catch (err) {
      console.error('Error locking channel:', err);
    }
  }

  const allItems = document.querySelectorAll('.channel-item');
  allItems.forEach(el => el.classList.remove('active'));
  item.classList.add('active');

  if (hls) {
    hls.destroy();
    hls = null;
  }

  videoPlayer.src = '';

  if (channel.url.includes('.m3u8')) {
    if (typeof Hls !== 'undefined') {
      hls = new Hls();
      hls.loadSource(channel.url);
      hls.attachMedia(videoPlayer);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        videoPlayer.play().catch(err => console.error('Error playing video:', err));
      });
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
      videoPlayer.src = channel.url;
      videoPlayer.play().catch(err => console.error('Error playing video:', err));
    }
  } else {
    videoPlayer.src = channel.url;
    videoPlayer.play().catch(err => console.error('Error playing video:', err));
  }
});

async function unlockChannel() {
  try {
    await fetch('/api/unlock', { method: 'POST' });
  } catch (err) {
    console.error('Error unlocking:', err);
  }
  locked = false;
  selectedChannel = null;
  lockStatus.className = 'lock-status unlocked';
  lockStatus.textContent = 'Desbloqueado';
  videoPlayer.pause();
  videoPlayer.src = '';
  if (hls) {
    hls.destroy();
    hls = null;
  }
  channelInfo.textContent = '';
}

lockStatus.addEventListener('click', unlockChannel);

loadChannels();
