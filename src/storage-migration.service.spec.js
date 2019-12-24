(function() {
  'use strict';

  describe('[Migration] Services', function() {
    var database = 'test';
    var sqlStorageMigrationService;

    // load the controller's module
    beforeEach(module('sf.sqlStorage',
    function($exceptionHandlerProvider, sqlStorageServiceProvider) {
      $exceptionHandlerProvider.mode('log');
      sqlStorageServiceProvider.addUpdater({
        version: 1.0,
        method: function() {},
      });
      sqlStorageServiceProvider.addUpdater({
        version: 2.0,
        method: function() {},
      });
      sqlStorageServiceProvider.addUpdater({
        version: 1.1,
        method: function() {},
      });
    }));

    // Initialize the controller and a mock scope
    beforeEach(inject(function(_sqlStorageMigrationService_) {
      sqlStorageMigrationService = _sqlStorageMigrationService_;
    }));

    describe('Instantiate', function() {
      it('should update available updaters', inject(function() {
        var version10 = sinon.stub(sqlStorageMigrationService._updateMethods, '1');
        var version11 = sinon.stub(sqlStorageMigrationService._updateMethods, '1.1');

        sqlStorageMigrationService.updateManager(database, 1.0);

        expect(version10.callCount).equal(0);
        expect(version11.callCount).equal(1);
      }));
      it('should update available updaters in the right order', inject(function() {
        var version10 = sinon.stub(sqlStorageMigrationService._updateMethods, '1');
        var version2 = sinon.stub(sqlStorageMigrationService._updateMethods, '2');

        sqlStorageMigrationService.updateManager(database, 1.0);

        expect(version10.callCount).equal(0);
        expect(version2.callCount).equal(1);
      }));
    });

  });
}());
