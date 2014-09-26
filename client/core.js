(function() {
  "use strict";
  
  xCore.registerExtension({
    name: "Testing Tools",
    loadSubList: function(extensionSubList) {
      extensionSubList.createComponent({ name: 'TestingTools', kind: 'XV.TestsSublist' });
      extensionSubList.render();
    },
    loadWorkspace: function(extensionWorkspace, item) {
      extensionWorkspace.createComponent(item);
      extensionWorkspace.render();
    }
  });
}());
