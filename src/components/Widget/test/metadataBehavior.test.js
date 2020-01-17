import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

import assetMock from 'tests-mocks/fileMock';
import Widget from '../index';
import { store, initStore } from '../../../store/store';
import LocalStorageMock from '../../../../mocks/localStorageMock';


describe('Metadata store affect app behavior', () => {
  const profile = assetMock;
  const handleUserMessage = jest.fn();

  const localStorage = new LocalStorageMock();
  let sentToSocket = [];
  const mockSocket = {
    emit: jest.fn((action, message) => sentToSocket.push({ action, message }))
  };
  initStore('dummy', 'dummy', mockSocket, localStorage);
  store.dispatch({
    type: 'CONNECT' });
  const widgetComponent = shallow(
    <Provider store={store}>
      <Widget
        store={store}
        handleNewUserMessage={handleUserMessage}
        profileAvatar={profile}
        dispatch={store.dispatch}
        connectOn="open"
        customMessageDelay={() => {}}
        connected
        isChatOpen={false}
      />
    </Provider>
    , { disableLifecycleMethods: true }
  );

  beforeEach(() => sentToSocket = []);

  it('should use the callbackIntent on expected url change', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'http://lorem.com' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: 'http://ipsum.com/cool',
            callbackIntent: '/yes',
            regex: false
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'http://ipsum.com/cool' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/yes');
  });

  it('should ignore host and use the callbackIntent on expected url change', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'http://lorem.com/blo' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: 'http://ipsum.com/bla',
            callbackIntent: '/yes',
            regex: false
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'http://lorem.com/bla' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/yes');
  });


  it('should use the errorIntent on bad url change', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'http://lorem.com/bou' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: 'http://ipsum.com/bla',
            callbackIntent: '/yes',
            regex: false
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'http://dolor.com/blo' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/no');
  });

  it('should use the regex for urlchecking', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'lorem.com' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: /dolor.+sit/,
            callbackIntent: '/yes',
            regex: true
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'dolor/amet/sit.com' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/yes');
  });

  it('should use multiple the regex/string for urlchecking', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'http://lorem.com' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: /dolor.+sit/,
            callbackIntent: '/dolor',
            regex: true
          },
          {
            url: 'elit.com/se',
            callbackIntent: '/se',
            regex: false
          },
          {
            url: /http:\/\/elit.+sed/,
            callbackIntent: '/yes',
            regex: true
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'http://elit.com/sed' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/yes');
  });

  it('should change the style of a element', () => {
    let elemAttributes;
    const spyFunc = jest.fn(() => ({ setAttribute(attribute, value) {
      elemAttributes = { attribute, value };
    } }));
    Object.defineProperty(document, 'querySelector', { value: spyFunc });

    store.dispatch({ type: 'SET_DOM_HIGHLIGHT',
      domHighlight: {
        selector: '.test',
        css: 'color: red'
      } });

    widgetComponent.dive().dive().instance().applyCustomStyle();

    expect(elemAttributes).toEqual({ attribute: 'style', value: 'color: red' });
    expect(spyFunc).toHaveBeenCalled();
    const botUtter = {
      text: 'test'
    };
    widgetComponent.dive().dive().instance().handleBotUtterance(botUtter);
    expect(elemAttributes).toEqual({ attribute: 'style', value: '' });
  });
});

