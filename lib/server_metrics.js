/*
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*jslint node: true */
'use strict';

/**
 * Class to hold server side metrics of event throughputs etc
 */
var ServerMetrics = function () {
  var self = this;

  //                            oldest to newest
  self.event_sample_weights = [0.1, 0.2, 0.3, 0.4];  // array length determines sample size

  self.reset();

};

/**
 * Reset the metric counts etc
 */
ServerMetrics.prototype.reset = function () {
  var self = this;

  self.lastEventTime = 0; // 1970
  self.event_count = 0;


  self.event_count_samples = [];
  self.event_sample_weights.forEach(function () {
    self.event_count_samples.push(0.0);
  });

  //self.weighted_avg_events_per_minute = 0.0;
};

/**
 * Increment the current minute's event count
 */
ServerMetrics.prototype.incEventCount = function () {
  var self = this,
      now = Date.now();  // Milliseconds since unix epoch

  if (now - self.lastEventTime > (60 * 1000)) { // > 1 minute
    self.lastEventTime = now;

    self.event_count_samples.push(self.event_count);
    // shift off oldest values, maintaining the correct number of samples for the weighted avg
    //for (var i = 0; i < (self.event_count_samples - self.event_sample_weights.length); i += 1) {
    self.event_count_samples.shift();
    //}
    self.event_count = 0;
  }

  self.event_count += 1;
};

/**
 * Return the calculated weighted average over a set of samples
 * @returns {number} Em - weighted avg numnber of events per minute.
 */
ServerMetrics.prototype.getWeightedEventRatePerMin = function () {
  var self = this,
      Em = 0.0;

  console.log('getWeightedEventRatePerMin() event_count_samples:', self.event_count_samples);

  for (var i = 0; i < self.event_sample_weights.length; i += 1) {
    Em += self.event_sample_weights[i] * self.event_count_samples[i];
  }
  return Em;
};


module.exports = ServerMetrics;
