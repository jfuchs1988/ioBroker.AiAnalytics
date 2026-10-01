import React from 'react';
import { ANALYSIS_GUIDE, CATALOG_FIELD_HELP } from './analysisGuideContent.js';

const LANGUAGE_LABELS = { de: 'Deutsch', en: 'English' };
const guideId = section => `ai-analytics-guide-${section}`;

export function FieldHelp({ field }) {
    const help = CATALOG_FIELD_HELP[field];
    if (!help) return null;

    return <details style={{ display: 'inline-block', position: 'relative', marginInlineStart: 5, verticalAlign: 'middle' }}>
        <summary
            aria-label={`Erklärung: ${help.label.de} / ${help.label.en}`}
            title={`${help.label.de} / ${help.label.en}`}
            style={{ cursor: 'help', display: 'inline-block', listStyle: 'none', border: '1px solid currentColor', borderRadius: '50%', width: 16, height: 16, lineHeight: '14px', textAlign: 'center', fontSize: 11 }}
        >
            <span aria-hidden="true">i</span>
        </summary>
        <div role="note" style={{ position: 'absolute', zIndex: 5, insetInlineStart: 0, top: '100%', width: 300, maxWidth: '80vw', padding: 10, border: '1px solid #9aa7b4', borderRadius: 4, background: 'var(--background-default, #fff)', boxShadow: '0 2px 8px #0003' }}>
            <strong>{help.label.de}</strong>
            <p style={{ margin: '4px 0 8px' }}><b>DE:</b> {help.de}</p>
            <strong>{help.label.en}</strong>
            <p style={{ margin: '4px 0 0' }}><b>EN:</b> {help.en}</p>
        </div>
    </details>;
}

function DefinitionTable({ rows, firstHeading, secondHeading, thirdHeading }) {
    const hasExamples = rows.some(row => row.example !== undefined);
    return <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0 16px' }}>
            <thead><tr>
                <th scope="col" style={tableHeaderStyle}>{firstHeading}</th>
                <th scope="col" style={tableHeaderStyle}>{secondHeading}</th>
                {hasExamples ? <th scope="col" style={tableHeaderStyle}>{thirdHeading}</th> : null}
            </tr></thead>
            <tbody>{rows.map(row => <tr key={row.value}>
                <th scope="row" style={tableCellStyle}><code>{row.value}</code></th>
                <td style={tableCellStyle}>{row.meaning}</td>
                {row.example !== undefined ? <td style={tableCellStyle}>{row.example}</td> : null}
            </tr>)}</tbody>
        </table>
    </div>;
}

const tableHeaderStyle = { textAlign: 'start', padding: '7px 9px', borderBottom: '2px solid #aab7c4' };
const tableCellStyle = { textAlign: 'start', verticalAlign: 'top', padding: '7px 9px', borderBottom: '1px solid #d7dde3' };

function FlowCard({ title, steps }) {
    return <article style={{ flex: '1 1 320px', minWidth: 0, border: '1px solid #c7d3df', borderRadius: 6, padding: 12 }}>
        <h4 style={{ margin: '0 0 8px' }}>{title}</h4>
        <ol style={{ margin: 0, paddingInlineStart: 22 }}>
            {steps.map((step, index) => <li key={index} style={{ marginBottom: 7, lineHeight: 1.5 }}>{step}</li>)}
        </ol>
    </article>;
}

export default function AnalysisGuide() {
    const [locale, setLocale] = React.useState('de');
    const guide = ANALYSIS_GUIDE[locale];
    const localized = locale === 'de';

    return <div lang={locale} style={{ display: 'grid', gap: 16, maxWidth: 1200, lineHeight: 1.55 }}>
        <header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ margin: 0 }}>{guide.title}</h2>
                <div role="group" aria-label={localized ? 'Sprache wählen' : 'Choose language'} style={{ display: 'flex', gap: 6 }}>
                    {Object.entries(LANGUAGE_LABELS).map(([value, label]) => <button
                        key={value}
                        type="button"
                        aria-pressed={locale === value}
                        onClick={() => setLocale(value)}
                    >{label}</button>)}
                </div>
            </div>
            <p style={{ margin: '8px 0' }}>{guide.intro}</p>
            <nav aria-label={localized ? 'Inhaltsübersicht' : 'Contents'} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {guide.sections.map(section => <a key={section.id} href={`#${guideId(section.id)}`} style={{ padding: '4px 8px', border: '1px solid #aab7c4', borderRadius: 4 }}>
                    {section.label}
                </a>)}
            </nav>
        </header>

        <section id={guideId('overview')}>
            <h3>{guide.overviewTitle}</h3>
            <ul>{guide.overview.map(item => <li key={item}>{item}</li>)}</ul>
        </section>

        <section id={guideId('workflow')}>
            <h3>{localized ? 'So entsteht eine Analyse' : 'How an analysis is produced'}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <FlowCard title={guide.chatFlowTitle} steps={guide.chatFlow} />
                <FlowCard title={guide.proactiveFlowTitle} steps={guide.proactiveFlow} />
            </div>
            <details style={{ border: '1px solid #c7d3df', borderRadius: 5, padding: 10, marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{guide.proactiveDetailsTitle}</summary>
                <ul>{guide.proactiveDetails.map(rule => <li key={rule} style={{ margin: '6px 0' }}>{rule}</li>)}</ul>
            </details>
        </section>

        <section id={guideId('tools')}>
            <h3>{guide.toolTitle}</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>
                        <th scope="col" style={tableHeaderStyle}>{localized ? 'Werkzeug' : 'Tool'}</th>
                        <th scope="col" style={tableHeaderStyle}>{localized ? 'Wofür?' : 'Purpose'}</th>
                        <th scope="col" style={tableHeaderStyle}>{localized ? 'Wichtige Eingaben' : 'Key inputs'}</th>
                        <th scope="col" style={tableHeaderStyle}>{localized ? 'Ergebnis' : 'Result'}</th>
                        <th scope="col" style={tableHeaderStyle}>{localized ? 'Wichtige Grenze' : 'Important limit'}</th>
                    </tr></thead>
                    <tbody>{guide.tools.map(tool => <tr key={tool.name}>
                        <th scope="row" style={tableCellStyle}><code>{tool.name}</code><br /><small>{localized ? 'Analyse · lesend' : 'Analysis · read-only'}</small></th>
                        <td style={tableCellStyle}>{tool.purpose}</td>
                        <td style={tableCellStyle}>{tool.inputs}</td>
                        <td style={tableCellStyle}>{tool.result}</td>
                        <td style={tableCellStyle}>{tool.limits}</td>
                    </tr>)}</tbody>
                </table>
            </div>
            <aside style={{ borderInlineStart: '4px solid #d39a19', padding: '8px 12px', marginTop: 12 }}>
                <h4 style={{ margin: '0 0 4px' }}>{guide.catalogWriteTitle}</h4>
                <p style={{ margin: 0 }}>{guide.catalogWrite}</p>
            </aside>
        </section>

        <section id={guideId('categories')}>
            <h3>{guide.categoriesTitle}</h3>
            <p>{guide.categoriesIntro}</p>
            <DefinitionTable
                rows={guide.categories}
                firstHeading={localized ? 'Kategorie' : 'Category'}
                secondHeading={localized ? 'Bedeutung und Beispiel' : 'Meaning and example'}
                thirdHeading=""
            />
            <h4>{guide.valueKindTitle}</h4>
            <p>{guide.valueKindNote}</p>
            <DefinitionTable
                rows={guide.valueKinds}
                firstHeading="valueKind"
                secondHeading={localized ? 'Bedeutung und Auswertung' : 'Meaning and calculation'}
                thirdHeading=""
            />
        </section>

        <section id={guideId('properties')}>
            <h3>{localized ? 'Alle Katalogeigenschaften' : 'All catalog properties'}</h3>
            <p>{localized
                ? 'Der Katalog verbindet Quellobjekt, fachliche Beschreibung, Rechenverhalten, Qualität und Analyse-Zuordnung. Die Herkunft zeigt, ob ein Feld aus ioBroker kommt, automatisch erkannt oder manuell bestätigt wurde.'
                : 'The catalog combines the source object, description, calculation behavior, quality, and analysis assignments. Provenance shows whether a value comes from ioBroker, was inferred, or was confirmed by a user.'}</p>
            {guide.propertyGroups.map((group, groupIndex) => <details key={group.title} open={groupIndex < 2} style={{ border: '1px solid #c7d3df', borderRadius: 5, padding: 8, margin: '8px 0' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{group.title}</summary>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                        <thead><tr>
                            <th scope="col" style={tableHeaderStyle}>{localized ? 'Feld' : 'Field'}</th>
                            <th scope="col" style={tableHeaderStyle}>{localized ? 'Typ / mögliche Werte' : 'Type / possible values'}</th>
                            <th scope="col" style={tableHeaderStyle}>{localized ? 'Herkunft' : 'Origin'}</th>
                            <th scope="col" style={tableHeaderStyle}>{localized ? 'Wirkung' : 'Effect'}</th>
                        </tr></thead>
                        <tbody>{group.fields.map(field => <tr key={field.name}>
                            <th scope="row" style={tableCellStyle}><code>{field.name}</code><br />{field.kind}</th>
                            <td style={tableCellStyle}>{field.values}</td>
                            <td style={tableCellStyle}>{field.origin}</td>
                            <td style={tableCellStyle}>{field.effect}</td>
                        </tr>)}</tbody>
                    </table>
                </div>
            </details>)}
            <h4>{localized ? 'Energie-Rollen' : 'Energy roles'}</h4>
            <DefinitionTable rows={guide.energyRoles} firstHeading="derivedMetricRole" secondHeading={localized ? 'Bedeutung' : 'Meaning'} />
            <p><strong>{localized ? 'Bilanz-Regel:' : 'Balance rule:'}</strong> {localized
                ? 'Eine Bilanz braucht PV-Erzeugung und Verbrauch als Zähler. Netz wird entweder durch das Zählerpaar grid_import/grid_feed_in oder durch einen grid_power-Gauge ersetzt. Batterie wird entweder als Paar battery_charge/battery_discharge oder als battery_power-Gauge abgebildet. PV-gauge ist für Leistungsanalysen erlaubt, aber nicht Teil der Bilanz.'
                : 'A balance needs PV generation and consumption as counters. Grid flow is represented either by the grid_import/grid_feed_in counter pair or one grid_power gauge. Battery flow is either the battery_charge/battery_discharge pair or one battery_power gauge. A PV gauge is allowed for power analysis but is not used in the balance.'}</p>
            <h4>{localized ? 'HVAC-Rollen' : 'HVAC roles'}</h4>
            <DefinitionTable rows={guide.hvacRoles} firstHeading="hvacRole" secondHeading={localized ? 'Bedeutung' : 'Meaning'} />
            <h4>{localized ? 'Prüfgründe' : 'Review reasons'}</h4>
            <DefinitionTable rows={guide.reviewReasons} firstHeading="reviewReasons" secondHeading={localized ? 'Bedeutung' : 'Meaning'} />
        </section>

        <section id={guideId('examples')}>
            <h3>{localized ? 'Beispiele vom Datenpunkt zur Erklärung' : 'Examples from state to explanation'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12 }}>
                {guide.examples.map(example => <article key={example.title} style={{ border: '1px solid #c7d3df', borderRadius: 6, padding: 12 }}>
                    <h4 style={{ margin: '0 0 6px' }}>{example.title}</h4>
                    <p style={{ margin: 0 }}>{example.text}</p>
                </article>)}
            </div>
        </section>

        <section id={guideId('limits')}>
            <h3>{guide.limitsTitle}</h3>
            <ul>{guide.limits.map(item => <li key={item}>{item}</li>)}</ul>
        </section>
    </div>;
}
