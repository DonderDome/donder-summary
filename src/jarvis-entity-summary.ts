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
  // @state() protected _isHassLoaded = false;
  // @state() protected _isOn = false;
  @state() protected _currentPercentages = {};
  @state() protected _timeouts = {};

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
          for (let i=0; i<=element.config.entities.length-1; i++) {
            if (this.config.icon === 'shutters') {
              const entity_open = element.config.entities[i]+'_open'
              const entity_close = element.config.entities[i]+'_close'

              if ((oldHass.states[entity_open] !== element.hass!.states[entity_open])) {
                hasChanged = true
                this.shutterListener(element.config.entities[i].split('.')[1]);  
              } else if ((oldHass.states[entity_close] !== element.hass!.states[entity_close])) {
                hasChanged = true
                this.shutterListener(element.config.entities[i].split('.')[1]);  
              }

            } else {
              const entity = element.config.entities[i]
              if (oldHass.states[entity] !== element.hass!.states[entity]) {
                hasChanged = true  
                break
              }
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

  //sw: living_room_shutters
  protected shutterListener(switch_name: any): any {
    console.log("shutterListener")
    // detect a close/open CHANGE in a switch (done)
    
    const open = this.hass.states[`switch.${switch_name}_open`].state === 'on'
    const close = this.hass.states[`switch.${switch_name}_close`].state === 'on'

    console.log(open, close, this._currentPercentages)

    // changed to on?
    if (open || close) {
      this._currentPercentages[switch_name] = parseFloat(this.hass?.states[`input_number.${switch_name}_percentage`].state)
      // get "direction" (open or close switch)
      if (open) {
        clearInterval(this._timeouts[switch_name])
        this._timeouts[switch_name] = setInterval(() => {
          const percentage = this._currentPercentages[switch_name]
          let newPercentage = percentage + 100/52

          if (newPercentage > 100) {
            newPercentage = 100
            this._currentPercentages[switch_name] = newPercentage
            this.stopShutter(switch_name)
          } else {
            this._currentPercentages[switch_name] = newPercentage
          }
          console.log("Up", this._currentPercentages[switch_name])
        }, 500)
      } else if (close) {
        clearInterval(this._timeouts[switch_name])
        this._timeouts[switch_name] = setInterval(() => {
          const percentage = this._currentPercentages[switch_name]
          let newPercentage = percentage - 100/52

          if (newPercentage < 0) {
            newPercentage = 0
            this._currentPercentages[switch_name] = newPercentage
            this.stopShutter(switch_name)
          } else {
            this._currentPercentages[switch_name] = newPercentage
          }
          console.log("Down", this._currentPercentages[switch_name])
        }, 500)
      }
    }

    // changed to off?
    if (!open && !close) {
      this.stopShutter(switch_name)
    }

  }

  protected stopShutter(switch_name: any): any {
    clearInterval(this._timeouts[switch_name])
    console.log("Stopped", this._currentPercentages[switch_name])
    this.hass.callService('input_number', 'set_value', {entity_id: `input_number.${switch_name}_percentage`, value: this._currentPercentages[switch_name]})
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
      .jarvis-sizer {
        max-width: 100%;
        opacity: 0;
      }
      .jarvis-widget {
        color: #fff;
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        padding: 15px 16px;
        box-sizing: border-box;
        background: url('/local/jarvis/assets/cctv_frame_fat.svg');
        background-repeat: no-repeat;
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
        .jarvis-widget {
          padding: 10px;
        }
        .summary-icon {
          display: none;
        }
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

    const numEntities = this.config.entities.length
    const numActiveEntities = this.config.entities.filter(e => this.hass.states[e]?.state === 'on').length

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
        <img src='/local/jarvis/assets/sizer.jpg' class="jarvis-sizer" />
        <div class='jarvis-widget'>
          <div class='title'>${this.config.name}</div>
          <div class='summary-amount'>
            <div class='summary-amount-num'>${`${numActiveEntities}/${numEntities}`}</div>
            <img src='/local/jarvis/assets/summary_bs.svg' />
          </div>
          <div class='summary-corner-bs'>
            <img src='/local/jarvis/assets/summary_corner.svg' />
          </div>
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
              <img src='/local/jarvis/assets/summary_gauge.svg' />
              <div class='summary-consumption'>40<span>W</span></div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("jarvis-entity-summary", BoilerplateCard);
