// 1. Firebase 설정 (본인의 Firebase Realtime Database 주소로 수정하세요)
// 예: "https://project-id-default-rtdb.firebaseio.com/"
const DATABASE_URL = 'https://finding-alumni-default-rtdb.firebaseio.com/';

// 데이터 초기 상태
let alumniData = [];
let messages = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentTargetAlumni = null;

// 2. Firebase 데이터 통신 함수
async function fetchData(path) {
  try {
    const response = await fetch(`${DATABASE_URL}${path}.json`);
    const data = await response.json();
    return data ? Object.values(data) : [];
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return [];
  }
}

async function postData(path, body) {
  try {
    await fetch(`${DATABASE_URL}${path}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('데이터 저장 실패:', error);
    alert('서버 연결에 실패했습니다.');
  }
}

// 초기 데이터 로드 및 UI 업데이트
async function init() {
  if (DATABASE_URL === 'YOUR_FIREBASE_URL_HERE') {
    alert('script.js 상단의 DATABASE_URL을 설정해주세요!');
    return;
  }

  alumniData = await fetchData('alumni');
  messages = await fetchData('messages');
  updateUI();
}

// 3. 요소 참조
const profileSection = document.getElementById('profile-section');
const myInfoDisplay = document.getElementById('my-info-display');
const myInfoText = document.getElementById('my-info-text');
const messageList = document.getElementById('message-list');
const searchSection = document.getElementById('search-section');

const registerBtn = document.getElementById('register-btn');
const startBtn = document.getElementById('start-btn');
const logoutBtn = document.getElementById('logout-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const searchBtn = document.getElementById('search-btn');
const schoolInput = document.getElementById('school-input');
const alumniList = document.getElementById('alumni-list');

// 4. 상태 관리 (로그인/로그아웃)
function updateUI() {
  if (currentUser) {
    profileSection.style.display = 'none';
    myInfoDisplay.style.display = 'block';
    searchSection.style.opacity = '1';
    searchSection.style.pointerEvents = 'auto';
    myInfoText.innerText = `${currentUser.school} / ${currentUser.name} (${currentUser.major}, ${currentUser.year})`;
    renderMessages();
  } else {
    profileSection.style.display = 'block';
    myInfoDisplay.style.display = 'none';
    searchSection.style.opacity = '0.5';
    searchSection.style.pointerEvents = 'none';
    alumniList.innerHTML =
      '<p class="placeholder-text">프로필을 먼저 등록해주세요.</p>';
  }
}

// 5. 프로필 등록 및 시작 기능
registerBtn.addEventListener('click', async () => {
  const school = document.getElementById('my-school').value.trim();
  const name = document.getElementById('my-name').value.trim();
  const major = document.getElementById('my-major').value.trim();
  const year = document.getElementById('my-year').value.trim();

  if (!school || !name || !major || !year) {
    alert('모든 정보를 입력해주세요!');
    return;
  }

  // 실시간 중복 체크를 위해 최신 데이터 다시 로드
  alumniData = await fetchData('alumni');
  const existing = alumniData.find(
    (p) => p.name === name && p.school === school,
  );

  if (existing) {
    alert('이미 등록된 프로필입니다. "시작하기" 버튼을 눌러주세요!');
    return;
  }

  const newUser = { id: Date.now(), name, school, major, year };
  await postData('alumni', newUser);

  alert('프로필 등록이 완료되었습니다! 이제 "시작하기"를 눌러주세요.');
  alumniData = await fetchData('alumni'); // 데이터 갱신
});

startBtn.addEventListener('click', async () => {
  const school = document.getElementById('my-school').value.trim();
  const name = document.getElementById('my-name').value.trim();
  const major = document.getElementById('my-major').value.trim();
  const year = document.getElementById('my-year').value.trim();

  if (!school || !name || !major || !year) {
    alert('정보를 모두 입력해주세요!');
    return;
  }

  // 최신 데이터 로드 후 확인
  alumniData = await fetchData('alumni');
  const user = alumniData.find(
    (p) =>
      p.name === name &&
      p.school === school &&
      p.major === major &&
      p.year === year,
  );

  if (!user) {
    alert('일치하는 프로필 정보가 없습니다. 등록을 먼저 해주세요.');
    return;
  }

  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  alert(`${user.name}님, 환영합니다!`);
  updateUI();
});

// 6. 로그아웃 및 검색
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateUI();
});

searchBtn.addEventListener('click', async () => {
  const keyword = schoolInput.value.trim();
  if (!keyword) {
    alert('학교 이름을 입력해주세요!');
    return;
  }

  // 검색 시에도 최신 데이터 반영
  alumniData = await fetchData('alumni');
  const results = alumniData.filter((p) => p.school.includes(keyword));
  renderResults(results);
});

function renderResults(results) {
  alumniList.innerHTML = '';
  if (results.length === 0) {
    alumniList.innerHTML =
      '<p class="placeholder-text">검색된 동문이 없습니다.</p>';
    return;
  }

  results.forEach((person) => {
    const isMe = currentUser && person.id === currentUser.id;
    const card = document.createElement('div');
    card.className = 'alumni-card';
    if (isMe) card.style.border = '2px solid #4a90e2';

    card.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 5px;">${isMe ? '⭐' : '👤'}</div>
            <h3>${person.name} ${isMe ? '(나)' : ''}</h3>
            <p><strong>${person.school}</strong></p>
            <div class="card-btns">
                <button onclick="openModal(${person.id}, '${person.name}')" style="flex:1">메시지 보내기</button>
            </div>
        `;
    alumniList.appendChild(card);
  });
}

// 7. 메시지 관련 기능
async function renderMessages() {
  messages = await fetchData('messages');
  const myMessages = messages.filter((m) => m.toId === currentUser.id);
  messageList.innerHTML = '';

  if (myMessages.length === 0) {
    messageList.innerHTML =
      '<p class="placeholder-text" style="font-size: 0.9rem;">받은 메시지가 없습니다.</p>';
    return;
  }

  myMessages.reverse().forEach((msg) => {
    const item = document.createElement('div');
    item.className = 'message-item';
    item.innerHTML = `
      <div class="message-sender">From: ${msg.fromName} (${msg.fromSchool})</div>
      <div class="message-content">${msg.content}</div>
      <div class="message-footer">
        <span class="message-date">${new Date(msg.date).toLocaleString()}</span>
        <div class="message-btns">
          <button class="reply-btn" onclick="openModal(${msg.fromId}, '${msg.fromName}')">답장</button>
        </div>
      </div>
    `;
    messageList.appendChild(item);
  });
}

const modal = document.getElementById('message-modal');
function openModal(id, name) {
  currentTargetAlumni = alumniData.find((p) => p.id === id);
  document.getElementById('modal-title').innerText = `${name}님께 메시지`;
  modal.style.display = 'block';
}

document.querySelector('.close-btn').onclick = () =>
  (modal.style.display = 'none');
window.onclick = (e) => {
  if (e.target == modal) modal.style.display = 'none';
};

document.getElementById('send-btn').onclick = async () => {
  const content = document.getElementById('message-text').value.trim();
  if (!content) {
    alert('내용을 입력해주세요!');
    return;
  }

  const newMessage = {
    id: Date.now(),
    fromId: currentUser.id,
    fromName: currentUser.name,
    fromSchool: currentUser.school,
    toId: currentTargetAlumni.id,
    content: content,
    date: new Date().toISOString(),
  };

  await postData('messages', newMessage);

  alert('메시지가 전송되었습니다!');
  modal.style.display = 'none';
  document.getElementById('message-text').value = '';
  renderMessages();
};

schoolInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

// 실행 시작
init();
