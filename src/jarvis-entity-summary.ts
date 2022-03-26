/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  TemplateResult,
  css,
  PropertyValues,
  CSSResultGroup,
} from 'lit';
import { property, state } from "lit/decorators";
import {
  HomeAssistant,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import { CARD_VERSION } from './constants';
import './editor';
// import './components/svg-item'
import type { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';

/* eslint no-console: 0 */
console.info(
  `%c  JARVIS-ENTITY-SUMMARY \n%c  version: ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'jarvis-entity-summary',
  name: 'Boilerplate Card',
  description: 'A template custom card for you to create something awesome',
});

export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('jarvis-entity-summary-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: BoilerplateCardConfig;

  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Boilerplate',
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return this.hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected hasConfigOrEntityChanged(element: any, changedProps: PropertyValues, forceUpdate: boolean): boolean {
    if (changedProps.has('config') || forceUpdate) {
      return true;
    }
    if (element.config!.entity || element.config!.entities) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      if (oldHass) {
        if (element.config.entities) {
          let hasChanged = false
          for (let i=0; i<element.config.entities.length-1; i--) {
            const entity = element.config.entities[i]
            if (oldHass.states[entity] !== element.hass!.states[entity]) {
              hasChanged = true
              break
            }
            return hasChanged
          }
        } else {
          return (
            oldHass.states[element.config!.entity]
            !== element.hass!.states[element.config!.entity]
          );
        }
      }
      return true;
    } else {
      return false;
    }
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .type-custom-jarvis-entity-summary {
        height: 100%;
        width: 100%;
      }
      .jarvis-widget {
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        padding: 18px 17px;
        box-sizing: border-box;
        border: 1px solid #fff;
      }
      .title {
        text-transform: uppercase;
        font-size: .9rem;
        font-weight: 300;
        margin-bottom: 17px;
      }
      .summary-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
      .summary-statuses {
        flex: 2;
      }
      .summary-icon {
        flex: 3;
        padding-left: 10px;
      }
      .summary-status {
        float: left;
        width: 13px;
        border: 1px solid rgb(255, 255, 255);
        box-sizing: border-box;
        margin-bottom: 4px;
        height: 13px;
        margin-right: 4px;
      }
      .summary-status.active {
        border: 2px solid #be9f6e;
        box-shadow: inset 0 0 10px #be9f6e, 0 0 5px #be9f6e;
      }
      .summary-status.innactive {

      }
    `;
  }

  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning('warning message');
    }

    if (this.config.show_error) {
      return this._showError('error message');
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${`Boilerplate: ${this.config || 'No Entity Defined'}`}
      >
        <div class='jarvis-widget'>
          <div class='title'>${this.config.name}</div>
          <div class='summary-wrapper'>
            <div class='summary-statuses'>
              ${this.config.entities.map(e => {
                const isActive = this.hass.states[e]?.state === 'on'
                return html`
                  <div class=${'summary-status '+ (isActive ? 'active' : 'innactive')}></div>
                `
              })}
            </div>
            <div class='summary-icon'>
              <svg-item state=${this.config.icon}></svg-item>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("jarvis-entity-summary", BoilerplateCard);
