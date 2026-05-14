// 1. 데이터 초기화
let alumniData = JSON.parse(localStorage.getItem('alumniDB')) || [
  {
    id: 1,
    name: '이철수(시험용)',
    school: '서강대',
    major: '컴퓨터공학',
    year: '19학번',
  },
  {
    id: 2,
    name: '김영희(시험용)',
    school: '서울대',
    major: '데이터분석',
    year: '20학번',
  },
];

let messages = JSON.parse(localStorage.getItem('alumniMessages')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentTargetAlumni = null; // 메시지를 받을 대상

// 2. 요소 참조
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

// 3. 상태 관리 (로그인/로그아웃)
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

// 4. 프로필 등록 및 시작 기능 분리
registerBtn.addEventListener('click', () => {
  const school = document.getElementById('my-school').value.trim();
  const name = document.getElementById('my-name').value.trim();
  const major = document.getElementById('my-major').value.trim();
  const year = document.getElementById('my-year').value.trim();

  if (!school || !name || !major || !year) {
    alert('모든 정보를 입력해주세요! (학교, 이름, 전공, 학번)');
    return;
  }

  const existing = alumniData.find(
    (p) => p.name === name && p.school === school,
  );

  if (existing) {
    alert('이미 등록된 프로필입니다. "시작하기" 버튼을 눌러주세요!');
    return;
  }

  const newUser = { id: Date.now(), name, school, major, year };
  alumniData.push(newUser);
  localStorage.setItem('alumniDB', JSON.stringify(alumniData));

  alert('프로필 등록이 완료되었습니다! 이제 "시작하기"를 눌러주세요.');
});

startBtn.addEventListener('click', () => {
  const school = document.getElementById('my-school').value.trim();
  const name = document.getElementById('my-name').value.trim();
  const major = document.getElementById('my-major').value.trim();
  const year = document.getElementById('my-year').value.trim();

  if (!school || !name || !major || !year) {
    alert('모든 정보를 입력해주세요! (학교, 이름, 전공, 학번)');
    return;
  }

  const user = alumniData.find(
    (p) =>
      p.name === name &&
      p.school === school &&
      p.major === major &&
      p.year === year,
  );

  if (!user) {
    alert(
      '일치하는 프로필 정보가 없습니다. 정보를 확인하거나 먼저 등록해주세요!',
    );
    return;
  }

  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  alert(`${user.name}님, 환영합니다!`);
  updateUI();
});

// 5. 로그아웃
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateUI();
});

// 탈퇴 버튼 연결
deleteAccountBtn.addEventListener('click', () => {
  if (currentUser) {
    deleteAlumni(currentUser.id);
  }
});

// 6. 동문 검색 및 렌더링
searchBtn.addEventListener('click', () => {
  const keyword = schoolInput.value.trim();
  if (!keyword) {
    alert('학교 이름을 입력해주세요!');
    return;
  }
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
function renderMessages() {
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
          <button class="del-btn small" onclick="deleteMessage(${msg.id})" style="padding: 4px 8px; font-size: 0.65rem; background-color: #ff4d4f; margin-left: 5px;">삭제</button>
        </div>
      </div>
    `;
    messageList.appendChild(item);
  });
}

// 메시지 삭제 기능
function deleteMessage(messageId) {
  if (confirm('이 메시지를 삭제하시겠습니까?')) {
    messages = messages.filter((m) => m.id !== messageId);
    localStorage.setItem('alumniMessages', JSON.stringify(messages));
    renderMessages();
  }
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

document.getElementById('send-btn').onclick = () => {
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

  messages.push(newMessage);
  localStorage.setItem('alumniMessages', JSON.stringify(messages));

  alert('메시지가 전송되었습니다!');
  modal.style.display = 'none';
  document.getElementById('message-text').value = '';
};

// 8. 정보 삭제 (탈퇴) 기능
function deleteAlumni(id) {
  if (
    confirm(
      '정말로 탈퇴하시겠습니까? 등록된 모든 정보와 주고받은 메시지가 삭제됩니다.',
    )
  ) {
    // 1. 유저 정보 삭제
    alumniData = alumniData.filter((p) => p.id !== id);
    localStorage.setItem('alumniDB', JSON.stringify(alumniData));

    // 2. 해당 유저와 관련된 모든 메시지 삭제 (보낸 것, 받은 것 모두)
    messages = messages.filter((m) => m.fromId !== id && m.toId !== id);
    localStorage.setItem('alumniMessages', JSON.stringify(messages));

    if (currentUser && currentUser.id === id) {
      currentUser = null;
      localStorage.removeItem('currentUser');
      updateUI();
      alert('탈퇴 처리가 완료되었습니다.');
    } else {
      const keyword = schoolInput.value.trim();
      renderResults(alumniData.filter((p) => p.school.includes(keyword)));
    }
  }
}

schoolInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});
updateUI();
