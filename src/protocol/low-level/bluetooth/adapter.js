/**
 * @fileoverview Bluetooth adapter constructor.
 *
 * @license Copyright 2015 The Coding with Chrome Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author mbordihn@google.com (Markus Bordihn)
 */
goog.provide('cwc.protocol.bluetooth.Adapter');

goog.require('cwc.protocol.bluetooth.Events');
goog.require('cwc.utils.Logger');


/**
 * @param {!chrome.bluetooth} bluetooth
 * @param {!goog.events.EventTarget} eventHandler
 * @constructor
 */
cwc.protocol.bluetooth.Adapter = function(bluetooth, eventHandler) {
  /** @type {!string} */
  this.name = 'Bluetooth Adapter';

  /** @type {!chrome.bluetooth} */
  this.bluetooth = bluetooth;

  /** @type {!string} */
  this.address = '';

  /** @type {!boolean} */
  this.powered = false;

  /** @type {!boolean} */
  this.available = false;

  /** @type {!boolean} */
  this.discovering = false;

  /** @type {boolean} */
  this.prepared = false;

  /** @type {boolean} */
  this.enabled = undefined;

  /** @private {!goog.events.EventTarget} */
  this.eventHandler_ = eventHandler;

  /** @type {!cwc.utils.Logger} */
  this.log_ = new cwc.utils.Logger(this.name);
};


/**
 * @export
 */
cwc.protocol.bluetooth.Adapter.prototype.prepare = function() {
  if (!this.prepared) {
    this.log_.info('Preparing ...');
    this.bluetooth.onAdapterStateChanged.addListener(
        this.handleAdapterState_.bind(this));
    this.eventHandler_.dispatchEvent(
      cwc.protocol.bluetooth.Events.adapterState({enabled: this.enabled}));
    this.updateAdapterState();
    this.prepared = true;
  }
};


/**
 * @export
 */
cwc.protocol.bluetooth.Adapter.prototype.updateAdapterState = function() {
  this.bluetooth.getAdapterState(this.handleAdapterState_.bind(this));
};


/**
 * @param {?} info
 * @private
 */
cwc.protocol.bluetooth.Adapter.prototype.handleAdapterState_ = function(info) {
  if (!info) {
    this.log_.error('Error receiving adapter state.');
    return;
  }
  this.address = info['address'];
  this.name = info['name'];
  this.powered = info['powered'];
  this.available = info['available'];
  this.discovering = info['discovering'];

  if (this.enabled == (this.available && this.powered && this.prepared)) {
    return;
  } else if (this.available && this.powered && !this.enabled) {
    this.log_.info('Enable adapter:', info);
    this.enabled = true;
  } else if (this.enabled || !this.prepared) {
    this.log_.info('Adapter is not prepared:', info);
    this.enabled = false;
  } else if (!this.address) {
    this.log_.info('Found no compatible Bluetooth adapter!');
    this.log_.info(info);
    this.enabled = false;
  }

  this.eventHandler_.dispatchEvent(
    cwc.protocol.bluetooth.Events.adapterState({enabled: this.enabled}));
};
