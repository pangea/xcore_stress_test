enyo.kind({
  name: 'XV.WebsocketStressOptions',
  kind: 'enyo.Control',
  published: {
    totalRequests: 1,
    concurrency: 1
  },
  events: {
    onStartTest: ''
  },
  components: [
    { kind: 'onyx.InputDecorator', style: 'display: block', components: [
      { content: 'Total Requests:&nbsp;', allowHtml: true },
      { name: 'requests', kind: 'onyx.Input', type: 'number', value: 1 }
    ]},
    { kind: 'onyx.InputDecorator', style: 'display: block', components: [
      { content: 'Concurrent Requests:&nbsp;', allowHtml: true },
      { name: 'concurrency', kind: 'onyx.Input', type: 'number', value: 1 }
    ]},
    { kind: 'onyx.Button', ontap: 'beginTest', content: 'Start Test' }
  ],
  bindings: [
    { from: '.$.requests.value', to: '.totalRequests' },
    { from: '.$.concurrency.value', to: '.concurrency' }
  ],
  beginTest: function() {
    this.doStartTest();
  }
});

enyo.kind({
  name: 'XV.WebsocketTestResults',
  kind: 'enyo.FittableRows',
  published: {
    started: 0,
    completed: 'N/A',
    failed: 'N/A',
    totalTime: 'N/A',
    longest: 'N/A',
    shortest: 'N/A',
    mode: 'N/A',
    mean: 'N/A'
  },
  components: [
    { components: [
      { content: 'Clients Started:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'started', tag: 'b' }
    ]},
    { components: [
      { content: 'Requests Completed:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'completed', tag: 'b' }
    ]},
    { components: [
      { content: 'Requests Failed:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'failed', tag: 'b' }
    ]},
    { components: [
      { content: 'Total Time:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'totalTime', tag: 'b' }
    ]},
    { components: [
      { content: 'Longest Request:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'longest', tag: 'b' }
    ]},
    { components: [
      { content: 'Shortest Request:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'shortest', tag: 'b' }
    ]},
    { components: [
      { content: 'Mode Request Time:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'mode', tag: 'b' }
    ]},
    { components: [
      { content: 'Mean Request Time:', tag: 'span',
        style: 'display: inline-block; width: 200px; padding: 5px;  border-bottom: 1px solid #eee;' },
      { name: 'mean', tag: 'b' }
    ]}
  ],
  bindings: [
    { from: '.started',   to: '.$.started.content' },
    { from: '.completed', to: '.$.completed.content' },
    { from: '.failed',    to: '.$.failed.content' },
    { from: '.totalTime', to: '.$.totalTime.content' },
    { from: '.longest',   to: '.$.longest.content' },
    { from: '.shortest',  to: '.$.shortest.content' },
    { from: '.mode',      to: '.$.mode.content' },
    { from: '.mean',      to: '.$.mean.content' }
  ]
});

enyo.kind({
  name: 'XV.WebsocketStressTest',
  kind: 'enyo.Control',
  handlers: {
    onStartTest: 'beginTest'
  },
  components: [
    {kind: 'enyo.FittableColumns', components: [
      { name: 'options', kind: 'XV.WebsocketStressOptions' },
      { name: 'output', kind: 'XV.WebsocketTestResults', fit: true }
    ]}
  ],
  beginTest: function() {
    var that = this,
        // Need to make, at least, one request
        totalRequests = Math.max(this.$.options.totalRequests, 1) || 1,
        // can't have higher concurrency than requests
        totalClients = Math.min(this.$.options.concurrency, totalRequests) || 1,
        requestsStarted = 0,
        requestsFinished = 0,
        clients = [],
        longestTime = 0,
        shortestTime = Infinity,
        failedRequests = 0,
        // Start/end times by reqID
        // e.g. "some-id" : { startTime: 0, endTime: 10, duration: 10 }
        responseTimes = {},
        startTime, endTime, modeTime, meanTime;

    function calculateTimes() {
      var keys = enyo.keys(responseTimes),
          modeMap = {},
          modeCount = 1;

      meanTime = 0;

      for(var i = 0, key, times, dur; (key = keys[i], times = responseTimes[key]); i++) {
        dur = times.duration;

        // ensure this request has finished
        if(dur) {
          meanTime += dur;

          if(longestTime < dur) {
            longestTime = dur;
          }

          if(shortestTime > dur) {
            shortestTime = dur;
          }

          // nieve mode calculation
          dur = Math.round(dur);
          modeMap[dur] || (modeMap[dur] = 0);
          modeMap[dur] += 1;

          if(modeMap[dur] > modeCount) {
            modeCount = modeMap[dur];
            modeTime = dur;
          }
        }
      }

      meanTime = meanTime/requestsFinished;
    }

    function updateUI() {

      if(requestsFinished < totalRequests) {
      // don't recalc too often
        enyo.job.throttle('recalc times', calculateTimes, 250);
        setTimeout(updateUI, 25);
      } else {
        // one last recalc before we call it 'done'
        calculateTimes();
      }

      var timeElapsed = new Date(enyo.perfNow() - startTime);

      timeElapsed = enyo.format('%n:%n:%n.%n',
                                timeElapsed.getUTCHours(),
                                timeElapsed.getUTCMinutes(),
                                timeElapsed.getUTCSeconds(),
                                timeElapsed.getUTCMilliseconds());

      that.$.output.set('completed', requestsFinished + '/' + totalRequests);
      that.$.output.set('failed', failedRequests);
      that.$.output.set('totalTime', timeElapsed);
      that.$.output.set('longest', Math.round(longestTime) + ' ms');
      that.$.output.set('shortest', Math.round(shortestTime) + ' ms');
      that.$.output.set('mode', modeTime ? modeTime + ' ms' : 'N/A');
      that.$.output.set('mean', Math.round(meanTime) + ' ms');
    }

    /**
     * @private
     * Creates all the clients and sets up the necessary callbacks
     *
     * After all the clients have been initialized, calls startTest.
     */
    function setupClients() {
      var clientsInitialized = 0;

      for(var i = 0, client; i < totalClients; i++) {
        // create a new client and add it to the stack
        client = Primus.connect();

        client.on('open', function() {
          clientsInitialized++;
          // display connected clients on the UI
          that.$.output.set('started', clientsInitialized);

          if(clientsInitialized >= totalClients) {
            // run the test once all the clients have been initialized
            startTest();
          }
        });

        client.on('data', function(data) {
          var times = responseTimes[data.reqId],
              duration;

          // shit...
          if(!times) {
            throw new Error('No time info found for ' + data.reqId);
          }

          times.endTime = enyo.perfNow();
          times.duration = duration = times.endTime - times.startTime;

          requestsFinished++;
          clientFree(this);
        });

        client.on('error', function(err) {
          console.error(err);
          failedRequests++;
        });

        clients.push(client);
      }
    }

    /**
     * @private
     * Initiates the test and starts updating the UI
     */
    function startTest() {
      startTime = enyo.perfNow();

      for(var i = 0, client; (client = clients[i]); i++) {
        clientFree(client);
      }

      updateUI();
    }

    /**
     * @private
     * Clients call this function and pass in themselves when finished with a
     * requests.  This will then send a new request, if more requests should be
     * made, or kill the client, if not.
     *
     * @param {Spark} client a Primus websocket client
     */
    function clientFree(client) {
      if(requestsStarted >= totalRequests) {
        client.end();

        // Check if test has finished
        if(requestsFinished >= totalRequests) {
          endTime = enyo.perfNow();
          // recalculate times and update the UI
          calculateTimes();
          updateUI();
          clients = undefined;
        }
      } else {
        requestsStarted++;

        var payload = {
              reqId: enyo.uuid(),
              method: 'GET',
              data: {}
            };

        client.write(payload);

        responseTimes[payload.reqId] = {
          startTime: enyo.perfNow()
        };
      }
    }

    setupClients();
  }
});
