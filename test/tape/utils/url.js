/**
 * Test utils/Url.js
 * @file
 */
import test from 'tape';
import sinon from 'sinon';
import Backbone from 'backbone';
import Url from '../../../app/scripts/utils/Url';

let sand;
test('Url: before()', t => {
    sand = sinon.sandbox.create();
    t.end();
});

test('Url: noteFilters', t => {
    t.equal(typeof Url.prototype.channel, 'object', 'is an object');
    t.equal(Url.prototype.channel.channelName, 'utils/Url');
    t.end();
});

test('Url: noteFilters', t => {
    t.equal(typeof Url.prototype.noteFilters, 'object', 'is an object');
    t.end();
});

test('Url: constructor()', t => {
    document.location.hash = '/p/default/';
    const reply = sand.spy(Url.prototype.channel, 'reply');
    const url   = new Url();

    t.equal(typeof url.hashOnStart, 'string', 'saves the original location hash');
    t.equal(url.profileId, 'default', 'saves the current profile Id');
    t.equal(reply.called, true, 'starts replying to requests');
    t.equal(url.channel.request('getHashOnStart'), url.hashOnStart,
        'replies to getHashOnStart request');

    sand.restore();
    url.channel.stopReplying();
    t.end();
});

test('Url: getHash()', t => {
    const url = new Url();
    Backbone.history.fragment = '/notes';

    t.equal(url.getHash(), Backbone.history.fragment);

    Backbone.history.fragment = null;
    url.channel.stopReplying();
    t.end();
});

test('Url: checkProfile()', t => {
    const reload = sand.stub(window.location, 'reload');
    const url = new Url();

    url.checkProfile();
    t.equal(reload.notCalled, true, 'msg');

    document.location.hash = '/p/new-profile/';
    url.checkProfile();
    t.equal(reload.called, true, 'msg');

    sand.restore();
    url.channel.stopReplying();
    t.end();
});

test('Url: navigate()', t => {
    const url      = new Url();
    const navigate = sand.spy(Backbone.history, 'navigate');

    url.navigate({url: 'http://example.com'});
    t.equal(navigate.calledWithMatch('http://example.com', {trigger: true}), true,
        'navigates to the page');

    sand.stub(url, 'getNoteLink').returns('https://noteLink');
    url.navigate({url: 'http://example.com', filterArgs: true, trigger: false});
    t.equal(navigate.calledWithMatch('https://noteLink', {trigger: false}), true,
        'generates link to a note');

    sand.stub(url, 'getProfileLink').returns('https://example.com');
    url.navigate({url: 'http://example.com', includeProfile: true});
    t.equal(navigate.calledWithMatch('https://example.com', {trigger: true}), true,
        'includes profile link');

    sand.restore();
    url.channel.stopReplying();
    t.end();
});

test('Url: navigateBack()', t => {
    const url      = new Url();
    const back     = sand.spy(window.history, 'back');
    const navigate = sand.stub(url, 'navigate');
    const length   = sand.stub(url, 'historyLength');

    length.returns(0);
    url.navigateBack({url: 'http://example.com'});
    t.equal(back.notCalled, true,
        'does not call window.history.back if location history is empty');
    t.equal(navigate.calledWith({url: 'http://example.com', includeProfile: true}), true,
        'calls this.navigate');

    length.returns(1);
    url.navigateBack();
    t.equal(back.called, true, 'calls window.history.back');

    sand.restore();
    url.channel.stopReplying();
    t.end();
});

test('Url: historyLength()', t => {
    const url = new Url();
    t.equal(url.historyLength(), window.history.length, 'returns window.history.length');
    url.channel.stopReplying();
    t.end();
});

test('Url: getProfileLink()', t => {
    const url = new Url();

    const link = url.getProfileLink({profileId: 'default', url: '/p/notes/notes'});
    t.equal(link, '/p/default/notes', 'ok');

    sand.stub(url, 'getProfileId').returns('my-profile');
    const link2 = url.getProfileLink({url: '/notes'});
    t.equal(link2, '/p/my-profile/notes', 'msg');

    url.channel.stopReplying();
    t.end();
});

test('Url: getProfileId()', t => {
    const url = new Url();

    document.location.hash = '/p/test-profile1/';
    t.equal(url.getProfileId(), 'test-profile1', 'returns correct profile');

    document.location.hash = '/notes/p1';
    t.equal(url.getProfileId(), null, 'returns correct profile');

    url.channel.stopReplying();
    t.end();
});

test('Url: getNoteLink()', t => {
    const url = new Url();
    const spy = sand.spy(url, 'getNotesLink');

    t.equal(url.getNoteLink({id: 'my-id'}), 'notes/show/my-id',
        'returns a link to a note');
    t.equal(spy.calledWith({id: 'my-id'}), true, 'calls getNotesLink method');

    t.equal(url.getNoteLink({model: {id: 'test-id'}}), 'notes/show/test-id',
        'uses model.id');

    t.equal(url.getNoteLink({}), 'notes',
        'returns notes link if both ID and model were not provided');

    sand.restore();
    url.channel.stopReplying();
    t.end();
});

test('Url: getNotesLink()', t => {
    const url = new Url();
    const spy = sand.spy(url, 'getProfileLink');

    let link = url.getNotesLink({
        filterArgs: {filter: 'notebooks', query: 'id', page: '2', profileId: 'default'},
    });
    t.equal(link, '/p/default/notes/f/notebooks/q/id/p2', 'returns a correct url');
    t.equal(spy.called, true, 'calls getProfileLink()');

    link = url.getNotesLink({
        filterArgs: {filter: 'notebooks', query: 'id'},
    });
    t.equal(link, 'notes/f/notebooks/q/id', 'returns a correct url');

    sand.restore();
    url.channel.stopReplying();
    t.end();
});

test('Url: getFileLink()', t => {
    const url = new Url();

    let link = url.getFileLink({model: {id: 'my-id'}});
    t.equal(link, '#file:my-id', 'returns a pseudo link');

    window.URL = {createObjectURL: sand.stub()};
    link = url.getFileLink({src: 'file-src', blob: true});
    t.equal(window.URL.createObjectURL.calledWith('file-src'), true,
        'creates Object URL');

    const model = {get: () => 'my-file-src'};
    link = url.getFileLink({model, blob: true});
    t.equal(window.URL.createObjectURL.calledWith('my-file-src'), true,
        'creates Object URL');

    sand.restore();
    url.channel.stopReplying();
    t.end();
});
