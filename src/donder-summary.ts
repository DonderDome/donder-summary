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
  `%c  Donder Summary \n%c  version: ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'donder-summary',
  name: 'Donder Summary',
  description: 'A template custom card for you to create something awesome',
});

export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('donder-summary-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() state!: string
  @property() config!: any
  @property() _env!: any
  @property() event!: any
  @property() callback!: any
  @state() protected _active;
  @state() protected _expanded = false;

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
    
    const entities = this.config?.env?.[this.config.icon]

    if (entities?.length) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
      if (oldHass) {
        if (entities.length) {
          let hasChanged = false
          for (let i=0; i<=entities.length-1; i++) {
            const entity = entities[i]
            if (oldHass.states[entity] !== element.hass!.states[entity]) {
              hasChanged = true  
              break
            }            
          }
          return hasChanged
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

  protected _handleAction(ev: ActionHandlerEvent): void {
    const { action } = ev?.detail

    if (action === 'tap') {
      this.handleClick()
    }
  }

  private handleClick(): void {
    const env = this.hass.states['donder_env.global'].attributes

    if (env) {
      this.hass.callService('browser_mod', 'popup', { 
        content: {
          type: 'custom:donder-summary-modal',
          entities: env[this.config.icon],
          env,
          showScenes: this.config.name === 'Routines'
        },
        left_button: "Close",
        left_button_action: this.hass.callService('browser_mod', 'close_popup', {browser_id: localStorage.getItem('browser_mod-browser-id')}),
        browser_id: localStorage.getItem('browser_mod-browser-id'),
        card_mod: {
          style:{
            "ha-dialog$": `div.mdc-dialog div.mdc-dialog__surface {
              max-width: 90%;
            }
            `,
          }
        }
      })
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      .donder-widget {
        background-color: transparent;
        color: var(--text-primary-color);
        padding: 15px 22px 22px;
        box-sizing: border-box;
        text-align: center;
        border-radius: var(--ha-card-border-radius)
      }
      .title {
        text-transform: uppercase;
        font-size: 0.9rem;
        font-weight: 600;
        /* margin-bottom: 18px; */
        font-stretch: 160%;
      }
      .summary-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
      }
      .summary-statuses {
        flex: 1.6 1 0%;
        padding-right: 5px;
        padding-top: 5px;
        /* border-right: 2px solid rgba(255, 255, 255, 0.1); */
      }
      .summary-icon {
        flex: 3;
        padding-left: 10px;
        position: relative;
      }
      .summary-icon img {
        padding: 1px 3px;
        position: relative;
        margin-bottom: -10px;
      }
      .summary-status {
        float: left;
        width: 6px;
        box-sizing: border-box;
        margin: 2px 5px 4px 2px;
        height: 6px;
        border-radius: 100%;
        background: #323848;
      }
      .summary-status.active {
        background: rgba(255, 255, 255, 1);
      }
      .summary-status.innactive {

      }
      .summary-consumption {
        position: absolute;
        text-align: center;
        top: 0px;
        width: 100%;
        padding-right: 7px;
        height: 100%;
        box-sizing: border-box;
        font-size: 1em;
        font-weight: 600;
        padding-top: 27%;
      }
      .summary-consumption span {
        font-size: .7em;
      }
      .summary-corner-bs {
        position: absolute;
        top: 0;
        right: 0;
        width: 13%;
        padding: 15px;
      }
      .summary-amount {
        font-weight: 600;
        opacity: 0.5;
        font-size: 0.8em;
        margin-top: -5px;
        margin-bottom: 3px;
      }
      .summary-amount .summary-amount-num {
        display: inline-block;
      }
      .summary-amount img{
        display: inline-block;
        width: 27%;
        margin-left: 25px;
        position: relative;
        top: 2px;
      }

      @media (max-width: 949px) {
        .summary-statuses {
          display: none;
        }
        .summary-icon {
          padding: 0 15px;
        }
        .summary-consumption {
          display: none;
        }
      }
      @media (max-width: 600px) {
        .donder-widget {
          padding: 10px;
        }
        .summary-icon {
          display: none;
        }
      }
    `;
  }

  protected render() {

    if (this.config.show_warning) {
      return this._showWarning('warning message');
    }

    if (this.config.show_error) {
      return this._showError('error message');
    }
    const env = this.hass.states['donder_env.global'].attributes
    const entities = env?.[this.config.icon]
    const numEntities = entities?.length
    const numActiveEntities = entities?.filter(e => this.hass.states[e]?.state === 'on').length

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
        <div class='donder-widget'>
          <div class='title'>${this.config.name}</div>
          <div class='summary-amount'>
            <div class='summary-amount-num'>${`${numActiveEntities || 0}/${numEntities || 0}`}</div>
            <img src='/local/donder/assets/summary_bs.svg' />
          </div>
          <div class='summary-corner-bs'>
            <img src='/local/donder/assets/summary_corner.svg' />
          </div>
          <div class='summary-wrapper'>
            <div class='summary-statuses'>
              ${entities?.map(e => {
                const isActive = this.hass.states[e]?.state === 'on'
                return html`
                  <div class=${'summary-status '+ (isActive ? 'active' : 'innactive')}></div>
                `
              })}
            </div>
            <div class='summary-icon'>
              <img src='/local/donder/assets/summary_gauge.svg' />
              <div class='summary-consumption'>40<span>W</span></div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("donder-summary", BoilerplateCard);
