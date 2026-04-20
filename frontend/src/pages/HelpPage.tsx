import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HelpPage.css';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: (
      <div>
        <p>Welcome to <strong>Initiate</strong> — your digital D&D campaign companion. Here's how to get up and running quickly:</p>
        <ol>
          <li><strong>Create a character</strong> — Go to <Link to="/characters/create">Characters → New Character</Link> and follow the six-step wizard. You'll pick a species, class, background, ability scores, and optionally attach homebrew content.</li>
          <li><strong>Join or start a campaign</strong> — Head to <Link to="/campaigns">Campaigns</Link>. DMs can create a new campaign and share the invite code; players can join with that code.</li>
          <li><strong>Run combat</strong> — Inside a campaign, click <em>Start Combat</em> to open the initiative tracker. Enter each combatant's initiative roll and use the <em>Next Turn</em> button to advance the round.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'characters',
    title: 'Managing Characters',
    content: (
      <div>
        <h3>Character Creation Wizard</h3>
        <p>The wizard walks you through seven steps:</p>
        <ol>
          <li><strong>Name</strong> — Your character's name.</li>
          <li><strong>Species</strong> — Choose your race/species; some offer variant options and ability score flexibility.</li>
          <li><strong>Class</strong> — Determines hit die, saving throws, and spellcasting.</li>
          <li><strong>Background</strong> — Grants skill proficiencies, equipment, and a special feature.</li>
          <li><strong>Homebrew</strong> (optional) — Attach any approved homebrew content to this character.</li>
          <li><strong>Ability Scores</strong> — Choose Standard Array, Point Buy, or Roll.</li>
          <li><strong>Review</strong> — Preview your full character sheet before saving.</li>
        </ol>

        <h3>Character Sheet</h3>
        <p>After creation, the character sheet shows live stats. You can:</p>
        <ul>
          <li>Adjust current HP via the hit-point panel.</li>
          <li>Level up using the <em>Level Up</em> button (your character progresses to the next level).</li>
          <li>Download a PDF copy with the <em>Export PDF</em> button.</li>
          <li>View equipped items and encumbrance status in the Inventory section.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    content: (
      <div>
        <h3>For Dungeon Masters</h3>
        <ul>
          <li>Create a campaign with a join mode (invitation-only or approval-required).</li>
          <li>Share the join code with your players.</li>
          <li>Control which homebrew content is available in the campaign.</li>
          <li>Manage sessions and track player attendance.</li>
        </ul>
        <h3>For Players</h3>
        <ul>
          <li>Enter a join code to request membership in a campaign.</li>
          <li>Assign one of your characters to the campaign.</li>
          <li>View the campaign dashboard for session notes and party status.</li>
          <li>Use the in-campaign chat for out-of-turn coordination.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'combat',
    title: 'Combat Tracker',
    content: (
      <div>
        <p>The combat tracker is a real-time shared view available to the DM and all players in the campaign.</p>
        <ul>
          <li><strong>Add combatants</strong> — Add player characters automatically; add NPCs/monsters manually.</li>
          <li><strong>Roll initiative</strong> — Each participant enters their initiative roll; the tracker sorts automatically.</li>
          <li><strong>Advance turns</strong> — Click <em>Next Turn</em> to move to the next combatant. The tracker highlights whose turn it is.</li>
          <li><strong>Track spell effects</strong> — Add ongoing effects (e.g. <em>Bless</em>) with duration in rounds; the tracker automatically decrements and removes expired effects.</li>
          <li><strong>Display names</strong> — DMs can rename NPCs to show or hide creature identity.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'homebrew',
    title: 'Homebrew Content',
    content: (
      <div>
        <p>DMs can create custom species, classes, spells, and equipment. Homebrew content goes through a simple workflow:</p>
        <ol>
          <li>Open <em>Homebrew</em> from the navigation or a campaign page.</li>
          <li>Click <em>Create</em> and fill in the content form.</li>
          <li>Set the <em>Sharing</em> level: private, campaign-only, or public.</li>
          <li>Submit for review; admins may moderate public submissions.</li>
        </ol>
        <p><strong>Versioning:</strong> Each edit creates a new version so you can revert to a previous state.</p>
      </div>
    ),
  },
  {
    id: 'keyboard',
    title: 'Keyboard Shortcuts',
    content: (
      <div>
        <table aria-label="Keyboard shortcuts">
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><kbd>Tab</kbd></td><td>Move focus to the next interactive element</td></tr>
            <tr><td><kbd>Shift + Tab</kbd></td><td>Move focus to the previous interactive element</td></tr>
            <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Activate focused button or link</td></tr>
            <tr><td><kbd>Escape</kbd></td><td>Close modal dialogs and dropdown menus</td></tr>
            <tr><td><kbd>Alt + 1</kbd></td><td>Skip to main content (while nav has focus)</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    content: (
      <div>
        <details>
          <summary>Can I have multiple characters?</summary>
          <p>Yes — there's no limit. Manage all of them from the <Link to="/characters">Characters</Link> page.</p>
        </details>
        <details>
          <summary>Can the same character be in multiple campaigns?</summary>
          <p>A character can only be assigned to one active campaign at a time. Leaving a campaign preserves your character data.</p>
        </details>
        <details>
          <summary>What happens to my character when a campaign ends?</summary>
          <p>Your character remains in your library and can be assigned to a new campaign or kept as a record of past adventures.</p>
        </details>
        <details>
          <summary>Is homebrew content safe to share?</summary>
          <p>Public homebrew is moderated by site admins before it becomes discoverable to others. Campaign-scoped homebrew is only visible to campaign members.</p>
        </details>
        <details>
          <summary>How do I export my character sheet as a PDF?</summary>
          <p>Open the character detail page and click the <em>Export PDF</em> button in the header actions.</p>
        </details>
      </div>
    ),
  },
];

const HelpPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);

  const current = sections.find((s) => s.id === activeSection) ?? sections[0];

  return (
    <div className="help-page" aria-label="Help and documentation">
      <h1 className="help-title">Help &amp; Documentation</h1>

      <div className="help-layout">
        {/* Sidebar nav */}
        <nav className="help-sidebar" aria-label="Help topics">
          <ul role="list">
            {sections.map((section) => (
              <li key={section.id} role="listitem">
                <button
                  type="button"
                  className={`help-nav-btn ${activeSection === section.id ? 'active' : ''}`}
                  aria-current={activeSection === section.id ? 'true' : undefined}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content panel */}
        <article className="help-content" aria-labelledby={`help-heading-${current.id}`}>
          <h2 id={`help-heading-${current.id}`}>{current.title}</h2>
          {current.content}
        </article>
      </div>
    </div>
  );
};

export default HelpPage;
