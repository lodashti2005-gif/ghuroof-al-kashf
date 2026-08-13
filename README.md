# غرفة الألغاز

Build a polished Arabic RTL multiplayer murder mystery investigation web game called "غرفة التحقيق".

IMPORTANT:

The entire player-facing interface must be in Arabic, RTL, and use natural Kuwaiti Arabic. The visual style should feel like a premium dark cinematic crime investigation game, not a normal website or dashboard.

CORE GAME:

This is a multiplayer cooperative murder mystery game. A group of friends joins the same investigation room and works together to solve one murder case.

For this first version, create ONE complete playable murder case.

START SCREEN:

Create a cinematic dark landing page with:

- Game title: "غرفة التحقيق"

- Subtitle: "الحقيقة ما تنقال... تنكشف"

- Button: "ابدأ التحقيق"

- Button: "انضم لغرفة"

- Mysterious crime-scene atmosphere.

- Black/charcoal colors, subtle red accents, police/evidence visual details.

- Responsive design for phones, tablets and desktop.

MULTIPLAYER LOBBY:

When a player starts a game:

- Generate a 6-digit room code.

- Allow other players to join using the room code.

- Players enter a nickname.

- Show all joined players in the lobby.

- One player is the host.

- Host can press "ابدأ القضية".

- Design this so real-time multiplayer can later be connected to Supabase.

CASE INTRO:

After starting, show a cinematic case introduction.

Case title:

"قضية الليلة الأخيرة"

Victim:

"بدر العتيبي"

Age: 32

Location: a private chalet in Kuwait.

Story:

Bader was found dead inside a private room at the chalet after a gathering with friends. The door was not forced open. His phone disappeared, and four people at the chalet had different reasons to lie.

Show the victim as a large professional case card with:

- portrait placeholder

- name

- age

- time of death

- location

- short case description

Add a section reserved for an intro video showing how the victim was discovered. For now use a cinematic placeholder with a play button.

SUSPECTS:

Create four Kuwaiti suspects with professional portrait placeholders.

1. فهد المطيري

Age 34

Victim's close friend.

Calm but defensive.

2. نورة الشمري

Age 29

Victim's former fiancée.

Emotional but hiding information.

3. يوسف العازمي

Age 31

Business partner.

Confident and easily irritated.

4. دانة الهاجري

Age 27

Was at the gathering.

Quiet and observant.

Display suspects as clean investigation cards.

Portrait should be clearly visible on the RIGHT side of each card with the suspect information beside it.

Do not use tiny circular avatars.

INVESTIGATION ROOM:

Players can select a suspect and interrogate them.

Each suspect gets:

- exactly 5 minutes interrogation time

- visible countdown timer starting at 05:00

- stress meter from 0–100

- interrogation chat

- suspect portrait

- suspect name

- known information

- button to end interrogation

Create the interrogation UI to feel like a real police interrogation room.

AI CHAT:

Prepare the architecture for AI-powered suspects.

For now, create realistic demo responses.

The suspects must speak NATURAL KUWAITI DIALECT, not Modern Standard Arabic and not generic Gulf Arabic.

Example tone:

"إي كنت موجود، بس والله ما دخلت عليه الغرفة."

"لحظة شكو أنا بالموضوع؟ اسألوا غيري."

"قلت لكم اللي أعرفه، شتبون مني بعد؟"

Avoid robotic phrases and repetitive answers.

Each suspect should have:

- a private backstory

- secrets

- true information

- lies

- different personality

- different stress reactions

As interrogation becomes more aggressive or the player discovers contradictions, increase the stress meter.

EVIDENCE:

Create an evidence board.

Include at least 6 pieces of evidence:

- broken watch

- missing phone

- coffee cup

- threatening message

- security camera timestamp

- car key

Each evidence item should have:

- image placeholder

- evidence number

- short Arabic description

- status: discovered / locked

Players gradually unlock evidence during the investigation.

NOTES:

Add a shared investigator notebook where players can save notes about suspects and evidence.

CASE DASHBOARD:

Create a main investigation dashboard showing:

- victim

- four suspects

- discovered evidence

- investigation progress

- shared notes

- players currently in the room

FINAL ACCUSATION:

After investigating, allow players to vote for who they think killed Bader.

Show all four suspects.

Each player votes once.

Then reveal the group result.

Create a cinematic "كشف الحقيقة" sequence explaining:

- who the killer is

- motive

- timeline

- which clues proved it

- which suspects lied and why

IMPORTANT GAME DESIGN:

Do NOT reveal the killer before the final accusation.

Choose one killer internally and make the evidence logically point toward them.

Other suspects should also have secrets so they remain suspicious.

The mystery must be solvable through contradictions and evidence.

DESIGN:

- Arabic RTL everywhere

- premium cinematic crime aesthetic

- dark background

- elegant typography

- subtle red warning accents

- cards with good spacing

- large readable suspect images

- smooth transitions

- responsive for iPad, mobile and desktop

- no childish design

- no emojis in the game UI

- avoid excessive text on one screen

Build the complete frontend prototype with navigation between all these screens and realistic demo data.

Structure the code cleanly so we can later add:

1. Supabase real-time multiplayer

2. real AI API for suspect conversations

3. voice conversations

4. generated character portraits

5. intro video

6. additional murder cases

Do not require paid external APIs for this first prototype.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ghuroof-al-kashf.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/585ff846-21a5-456b-b0de-122a2dc5f217).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
