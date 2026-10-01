import React from 'react';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalysisGuide, { FieldHelp } from '../../src-admin/src/AnalysisGuide.jsx';
import { CATALOG_COLUMNS } from '../../src-admin/src/CatalogDevices/catalogColumns.js';
import {
    ANALYSIS_GUIDE,
    CATALOG_FIELD_HELP,
    ANALYSIS_TOOL_NAMES,
    CATEGORY_VALUES,
    VALUE_KIND_VALUES,
    DERIVED_ROLE_VALUES,
    HVAC_ROLE_VALUES,
    REVIEW_REASON_VALUES,
    FIELD_HELP_FIELDS,
} from '../../src-admin/src/analysisGuideContent.js';

const LOCALES = ['de', 'en'];
const require = createRequire(import.meta.url);
const { CATEGORIES, DERIVED_METRIC_ROLES, HVAC_ROLES } = require('../../lib/catalog.js');
const { VALUE_KINDS } = require('../../lib/valueKindClassifier.js');
const { REVIEW_REASONS } = require('../../lib/onboardingQualityGate.js');
const { buildTools } = require('../../lib/tools.js');
const CATALOG_WRITE_TOOLS = ['updateCatalogEntry', 'updateCatalogEntries'];

describe('analysis guide reference content', () => {
    it('tracks the supported category, valueKind, role, and tool enums', () => {
        const backendToolNames = buildTools({}).definitions.map(tool => tool.name);
        expect(CATEGORY_VALUES).to.deep.equal(CATEGORIES);
        expect(VALUE_KIND_VALUES).to.deep.equal(VALUE_KINDS);
        expect(DERIVED_ROLE_VALUES).to.deep.equal([...DERIVED_METRIC_ROLES]);
        expect(HVAC_ROLE_VALUES).to.deep.equal([...HVAC_ROLES]);
        expect(REVIEW_REASON_VALUES).to.deep.equal(Object.values(REVIEW_REASONS));
        expect(ANALYSIS_TOOL_NAMES).to.deep.equal(backendToolNames.filter(name => !CATALOG_WRITE_TOOLS.includes(name)));
        expect(CATALOG_WRITE_TOOLS.every(name => backendToolNames.includes(name))).to.equal(true);
    });

    it('documents the complete analysis toolset in both languages', () => {
        for (const locale of LOCALES) {
            const documentedNames = ANALYSIS_GUIDE[locale].tools.map(tool => tool.name);
            expect(documentedNames).to.deep.equal(ANALYSIS_TOOL_NAMES);
            expect(ANALYSIS_GUIDE[locale].tools.every(tool => tool.purpose && tool.inputs && tool.result && tool.limits)).to.equal(true);
            expect(ANALYSIS_GUIDE[locale].proactiveDetails).to.have.length(5);
        }
    });

    it('documents every category, value kind, and analysis role in both languages', () => {
        for (const locale of LOCALES) {
            expect(ANALYSIS_GUIDE[locale].categories.map(item => item.value)).to.deep.equal(CATEGORY_VALUES);
            expect(ANALYSIS_GUIDE[locale].valueKinds.map(item => item.value)).to.deep.equal(VALUE_KIND_VALUES);
            expect(ANALYSIS_GUIDE[locale].energyRoles.map(item => item.value)).to.deep.equal(DERIVED_ROLE_VALUES);
            expect(ANALYSIS_GUIDE[locale].hvacRoles.map(item => item.value)).to.deep.equal(HVAC_ROLE_VALUES);
            expect(ANALYSIS_GUIDE[locale].reviewReasons.map(item => item.value)).to.deep.equal(REVIEW_REASON_VALUES);
        }
    });

    it('gives every catalog property a German and English explanation', () => {
        for (const locale of LOCALES) {
            const documentedFields = ANALYSIS_GUIDE[locale].propertyGroups.flatMap(group => group.fields.map(field => field.name)).sort();
            expect(documentedFields).to.deep.equal([...FIELD_HELP_FIELDS].sort());
            expect(ANALYSIS_GUIDE[locale].propertyGroups.flatMap(group => group.fields).every(field => field.kind && field.values && field.origin && field.effect)).to.equal(true);
        }
        const catalogColumns = CATALOG_COLUMNS.filter(column => !['status', 'actions'].includes(column.key));
        expect(catalogColumns.every(column => FIELD_HELP_FIELDS.includes(column.key))).to.equal(true);
        for (const [field, help] of Object.entries(CATALOG_FIELD_HELP)) {
            expect(help.de, `${field} German help`).to.be.a('string').and.not.empty;
            expect(help.en, `${field} English help`).to.be.a('string').and.not.empty;
        }
    });
});

describe('AnalysisGuide', () => {
    it('starts in German and switches all guide content to English', async () => {
        const user = userEvent.setup();
        render(<AnalysisGuide />);

        expect(screen.getByRole('heading', { name: 'Wissen & Analyse' })).toBeInTheDocument();
        expect(screen.getByText(/Kategorie hilft beim fachlichen Sortieren und Filtern/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'English' }));

        expect(screen.getByRole('heading', { name: 'Understanding AI Analytics' })).toBeInTheDocument();
        expect(screen.getByText(/Category helps organize and filter by topic/)).toBeInTheDocument();
    });

    it('shows expanded bilingual field help for a catalog property', async () => {
        const user = userEvent.setup();
        render(<table><tbody><tr><td><FieldHelp field="valueKind" /></td></tr></tbody></table>);

        const help = screen.getByLabelText('Erklärung: Verhalten (valueKind) / Value behavior (valueKind)');
        await user.click(help);
        const note = within(help.closest('details')).getByRole('note');

        expect(note).toHaveTextContent('DE');
        expect(note).toHaveTextContent('EN');
        expect(note).toHaveTextContent('gauge');
        expect(note).toHaveTextContent('daily_reset_counter');
    });
});
