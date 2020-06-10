(function() {
  'use strict';

  describe('[Migration] Services', function() {
    var database = 'test';
    var sqlStorageMigrationService;
    var localStorageService;

    // load the controller's module
    beforeEach(module('sf.sqlStorage',
    function($exceptionHandlerProvider, sqlStorageServiceProvider) {
      $exceptionHandlerProvider.mode('log');
      sqlStorageServiceProvider.addUpdater({
        version: 1.0,
        method: function() { return Promise.resolve(); },
      });
      sqlStorageServiceProvider.addUpdater({
        version: 2.0,
        method: function() { return Promise.resolve(); },
      });
      sqlStorageServiceProvider.addUpdater({
        version: 1.1,
        method: function() { return Promise.resolve(); },
      });
      sqlStorageServiceProvider.addUpdater({
        version: 10,
        method: function() { return Promise.resolve(); },
      });
      sqlStorageServiceProvider.addUpdater({
        version: 20,
        method: function() { return Promise.resolve(); },
      });
    }));

    // Initialize the controller and a mock scope
    beforeEach(inject(function (_sqlStorageMigrationService_, _localStorageService_) {
      sqlStorageMigrationService = _sqlStorageMigrationService_;
      localStorageService = _localStorageService_;
    }));

    describe('Instantiate', function() {
      it('should update available updaters', inject(function($timeout, $q) {
        var version10 = sinon.stub(sqlStorageMigrationService._updateMethods, '1').returns($q.when());
        var version11 = sinon.stub(sqlStorageMigrationService._updateMethods, '1.1').returns($q.when());

        sqlStorageMigrationService.updateManager(database, 1.0);
        $timeout.flush();
        expect(version10.callCount).equal(0);
        expect(version11.callCount).equal(1);

      }));
      it('should update available updaters in the right order', inject(function($timeout, $q) {
        var version1 = sinon.stub(sqlStorageMigrationService._updateMethods, '1').returns($q.when());
        var version11 = sinon.stub(sqlStorageMigrationService._updateMethods, '1.1').returns($q.when());
        var version2 = sinon.stub(sqlStorageMigrationService._updateMethods, '2').returns($q.when());
        var version10 = sinon.stub(sqlStorageMigrationService._updateMethods, '10').returns($q.when());
        var version20 = sinon.stub(sqlStorageMigrationService._updateMethods, '20').returns($q.when());
        var setLocal = sinon.stub(localStorageService, 'set');

        sqlStorageMigrationService.updateManager(database, 1.0);
        $timeout.flush();
        expect(version1.callCount).equal(0);
        expect(version11.callCount).equal(1);
        expect(version2.callCount).equal(1);
        expect(version10.callCount).equal(1);
        expect(version20.callCount).equal(1);

        expect(setLocal.callCount).equal(4);

        expect(setLocal.args[0][1]).equal(1.1);
        expect(setLocal.args[1][1]).equal(2);
        expect(setLocal.args[2][1]).equal(10);
        expect(setLocal.args[3][1]).equal(20);
      }));
      it('should stop on first fail', inject(function($timeout, $q) {
        var version1 = sinon.stub(sqlStorageMigrationService._updateMethods, '1').returns($q.when());
        var version11 = sinon.stub(sqlStorageMigrationService._updateMethods, '1.1').returns($q.when());
        var version2 = sinon.stub(sqlStorageMigrationService._updateMethods, '2').returns($q.when());
        var version10 = sinon.stub(sqlStorageMigrationService._updateMethods, '10').returns($q.reject());
        var version20 = sinon.stub(sqlStorageMigrationService._updateMethods, '20').returns($q.when());
        var setLocal = sinon.stub(localStorageService, 'set');

        sqlStorageMigrationService.updateManager(database, 1.0);
        $timeout.flush();
        expect(version1.callCount).equal(0);
        expect(version11.callCount).equal(1);
        expect(version2.callCount).equal(1);
        expect(version10.callCount).equal(1);
        expect(version20.callCount).equal(0);

        expect(setLocal.callCount).equal(2);

        expect(setLocal.args[0][1]).equal(1.1);
        expect(setLocal.args[1][1]).equal(2);
      }));
    });

  });
}());
