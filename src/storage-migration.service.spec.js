(function() {
  'use strict';

  describe('[Migration] Services', function() {
    var database = 'test';
    var migrationService;

    // load the controller's module
    beforeEach(module('sfMobile.storage',
    function($exceptionHandlerProvider, storageServiceProvider) {
      $exceptionHandlerProvider.mode('log');
      storageServiceProvider.addUpdater({
        version: 1.0,
        method: function() {},
      });
      storageServiceProvider.addUpdater({
        version: 1.1,
        method: function() {},
      });
    }));

    // Initialize the controller and a mock scope
    beforeEach(inject(function(_migrationService_) {
      migrationService = _migrationService_;
    }));

    describe('Instantiate', function() {
      it('should update available updaters', inject(function() {
        var version10 = sinon.stub(migrationService._updateMethods, '1');
        var version11 = sinon.stub(migrationService._updateMethods, '1.1');

        migrationService.updateManager(database, 1.0);

        expect(version10.callCount).equal(0);
        expect(version11.callCount).equal(1);
      }));
    });

  });
}());
