# 의과학과 교수진 이름 북

대학원 체험 박람회에서 학부생에게 보여 줄 교수진 소개 책자예요. A4 한 장에 6명씩, 사진 · 이름 · 교실 · 한 줄 소개 · 키워드 · QR을 넣었어요.

- `namebook.pdf` — 인쇄용 (표지 1쪽 + 기초의학 7쪽 + 임상의학 5쪽)
- `namebook.html` — 같은 내용을 브라우저로 보기
- `data/profs.json` — 교수님별 내용. 고칠 때는 이 파일만 고쳐요
- `photos/` — 사진 (3:4, 파일 이름은 이메일 아이디)
- `build.py`, `style.css` — 만드는 코드와 디자인 (색·글꼴은 HaLab 슬라이드 갤러리 blue와 맞춤)
- `fonts/` — Pretendard (SIL OFL, `fonts/LICENSE.txt`)

## 고치고 다시 만들기

```bash
pip install segno
```

```bash
python3 build.py
```

`data/profs.json`의 항목:

| 키 | 내용 |
|---|---|
| `name`, `rank`, `dept`, `kind` | 이름, 직위, 교실, 기초/임상 (기초·임상 순 → 교실 → 이름 순으로 정렬돼요) |
| `line`, `keywords` | 한 줄 소개, 키워드 3개 |
| `link`, `linkLabel` | QR 주소와 그 아래 설명 |
| `photo` | 사진 경로 |
| `email`, `source` | 명단 확인용 이메일, 한 줄 소개의 근거 (책자에는 안 나와요) |

`source` 값: `bk` BK21 실적 조사 자료 · `dir` 의대 홈페이지 교수 소개 · `pure` 경북대 연구자 포털 · `pubmed` PubMed 논문 · `(확인 필요)` 본인 확인이 필요한 내용

QR은 연구실 홈페이지 → Google Scholar·연구자 프로필 → 의대 홈페이지 교수 소개 페이지 순으로 있는 것을 연결했어요.
