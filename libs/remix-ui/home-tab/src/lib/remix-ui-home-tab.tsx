import React, { useState, useRef, useEffect } from 'react' // eslint-disable-line

import './remix-ui-home-tab.css'
import { ModalDialog } from '@remix-ui/modal-dialog' // eslint-disable-line
import { Toaster } from '@remix-ui/toaster' // eslint-disable-line
import Mediumfeed from './components/mediumFeed' // eslint-disable-line
import PluginButton from './components/pluginButton' // eslint-disable-line
import QueryParams from '../../../../../apps/remix-ide/src/lib/query-params'
import { ThemeContext, themes } from './themeContext'
import { TwitterTimelineEmbed } from 'react-twitter-embed'
import { stat } from 'fs'

declare global {
  interface Window {
    _paq: any
  }
}
const _paq = window._paq = window._paq || [] //eslint-disable-line

/* eslint-disable-next-line */
export interface RemixUiHomeTabProps {
  plugin: any,
  registry: any
}

export const RemixUiHomeTab = (props: RemixUiHomeTabProps) => {
  const { plugin, registry } = props
  const [state, setState] = useState<{
    showBasicMigration: boolean,
    themeQuality: { filter: string, name: string },
    showMediaPanel: 'none' | 'twitter' | 'medium',
    showModalDialog: boolean,
    modalInfo: { title: string, loadItem: string, examples: Array<string> },
    importSource: string,
    toasterMsg: string
  }>({
    showBasicMigration: false,
    themeQuality: registry.get('themeModule').api.currentTheme().quality === 'dark' ? themes.dark : themes.light,
    showMediaPanel: 'none',
    showModalDialog: false,
    modalInfo: { title: '', loadItem: '', examples: []},
    importSource: '',
    toasterMsg: ''
  })

  const playRemi = async () => {
    remiAudioEl.current.play()
  }

  const remiAudioEl = useRef(null)
  const inputValue = useRef(null)

  useEffect(() => {
    registry.get('themeModule').api.events.on('themeChanged', (theme) => {
      // update theme quality. To be used for for images
      setState(prevState => {
        return { ...prevState, themeQuality: theme.quality === 'dark' ? themes.dark : themes.light }
      })
    })
    window.addEventListener('click', (event) => {
      const target = event.target as Element
      const id = target.id
      if (id !== 'remixIDEHomeTwitterbtn' && id !== 'remixIDEHomeMediumbtn') {
        // todo check event.target
        setState(prevState => { return { ...prevState, showMediaPanel: 'none' } })
      }
    })
  }, [])

  const toast = (message: string) => {
    setState(prevState => {
      return { ...prevState, toasterMsg: message }
    })
  }

  const createNewFile = async () => {
    await plugin.call('filePanel', 'createNewFile')
  }

  const uploadFile = async (target) => {
    await plugin.call('filePanel', 'uploadFile', target)
  }

  const connectToLocalhost = () => {
    plugin.appManager.activatePlugin('remixd')
  }
  const importFromGist = () => {
    plugin.gistHandler.loadFromGist({ gist: '' }, registry.get('filemanager').api)
    plugin.verticalIcons.select('filePanel')
  }
  const switchToPreviousVersion = () => {
    const query = new QueryParams()
    query.update({ appVersion: '0.7.7' })
    _paq.push(['trackEvent', 'LoadingType', 'oldExperience_0.7.7'])
    document.location.reload()
  }
  const startSolidity = async () => {
    await plugin.appManager.activatePlugin(['solidity', 'udapp', 'solidityStaticAnalysis', 'solidityUnitTesting'])
    plugin.verticalIcons.select('solidity')
    _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'solidity'])
  }
  const startOptimism = async () => {
    await plugin.appManager.activatePlugin('optimism-compiler')
    plugin.verticalIcons.select('optimism-compiler')
    _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'optimism-compiler'])
  }
  const startSolhint = async () => {
    await plugin.appManager.activatePlugin(['solidity', 'solhint'])
    plugin.verticalIcons.select('solhint')
    _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'solhint'])
  }
  const startLearnEth = async () => {
    await plugin.appManager.activatePlugin(['solidity', 'LearnEth', 'solidityUnitTesting'])
    plugin.verticalIcons.select('LearnEth')
    _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'learnEth'])
  }
  const startSourceVerify = async () => {
    await plugin.appManager.activatePlugin(['solidity', 'source-verification'])
    plugin.verticalIcons.select('source-verification')
    _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'source-verification'])
  }
  const startPluginManager = async () => {
    await plugin.appManager.activatePlugin('pluginManager')
    plugin.verticalIcons.select('pluginManager')
  }

  const showFullMessage = (title: string, loadItem: string, examples: Array<string>) => {
    console.log('showFullMessage')
    setState(prevState => {
      return { ...prevState, showModalDialog: true, modalInfo: { title: title, loadItem: loadItem , examples: examples } }
    })
  }

  const hideFullMessage = () => { //eslint-disable-line
    setState(prevState => {
      return { ...prevState, showModalDialog: false, importSource: '' }
    })
  }

  const processLoading = () => {
    const contentImport = plugin.contentImport
    const fileProviders = registry.get('fileproviders').api
    contentImport.import(
      state.importSource,
      (loadingMsg) => { setState(prevState => { return { ...prevState, tooltip: loadingMsg } }) },
      (error, content, cleanUrl, type, url) => {
        if (error) {
          toast(error.message || error)
        } else {
          try {
            fileProviders.workspace.addExternal(type + '/' + cleanUrl, content, url)
            plugin.call('menuicons', 'select', 'filePanel')
          } catch (e) {
            toast(e.message)

          }
        }
      }
    )
    setState(prevState => {
      return { ...prevState, showModalDialog: false }
    })
  }

  const maxHeight = Math.max(window.innerHeight - 150, 250) + 'px'
  const examples = state.modalInfo.examples.map((urlEl, key) => (<div key={key} className="p-1 user-select-auto"><a>{urlEl}</a></div>))
  const elHeight = '4000px'
  return (
    <>
      <ModalDialog
        title={ 'Import from ' + state.modalInfo.title }
        okLabel='Import'
        hide={ !state.showModalDialog }
        handleHide={ () => hideFullMessage() }
        okFn={ () => {
          processLoading()
          setState(prevState => {
            return { ...prevState, importSource: '' }
          })}
        }
      >
        <div className="p-2 user-select-auto">
          { state.modalInfo.loadItem !== '' && <span>Enter the { state.modalInfo.loadItem } you would like to load.</span> }
          { state.modalInfo.examples.length !== 0 &&
          <>
            <div>e.g</div>
            <div>
              { examples }
            </div>
          </> }
          <input
            ref={inputValue}
            type='text'
            name='prompt_text'
            id='prompt_text'
            className="w-100 form-control"
            data-id="modalDialogCustomPromptText"
            value={state.importSource}
            onInput={(e) => {
              setState(prevState => {
                return { ...prevState, importSource: inputValue.current.value }
              })
            }}
          />
        </div>
      </ModalDialog>
      <Toaster message={state.toasterMsg} />
      <div className="d-flex flex-column" id="remixUiRightPanel">
        <div className="border-bottom d-flex flex-column justify-content-between clearfix py-3 mb-4">
          <div className="mx-4 w-100 d-flex">
            <img className="m-4 remixui_logoImg" src="assets/img/guitarRemiCroped.webp" onClick={ () => playRemi() } alt=""></img>
            <audio
              id="remiAudio"
              muted={false}
              src="assets/audio/remiGuitar-single-power-chord-A-minor.wav"
              ref={remiAudioEl}
            ></audio>
          </div>
        </div>
        <div className="row remixui_hpSections mx-4" data-id="landingPageHpSections">
          <div className="ml-3">
            <div className="mb-5">
              <h4>Featured Plugins</h4>
              <div className="d-flex flex-row pt-2">
                <ThemeContext.Provider value={ state.themeQuality }>
                  <PluginButton imgPath="assets/img/solidityLogo.webp" envID="solidityLogo" envText="Solidity" callback={() => startSolidity()} />
                  <PluginButton imgPath="assets/img/optimismLogo.webp" envID="optimismLogo" envText="Optimism" callback={() => startOptimism()} />
                  <PluginButton imgPath="assets/img/solhintLogo.webp" envID="solhintLogo" envText="Solhint linter" callback={() => startSolhint()} />
                  <PluginButton imgPath="assets/img/learnEthLogo.webp" envID="learnEthLogo" envText="LearnEth" callback={() => startLearnEth()} />
                  <PluginButton imgPath="assets/img/sourcifyLogo.webp" envID="sourcifyLogo" envText="Sourcify" callback={() => startSourceVerify()} />
                  <PluginButton imgPath="assets/img/moreLogo.webp" envID="moreLogo" envText="More" callback={startPluginManager} />
                </ThemeContext.Provider>
              </div>
            </div>
            <div className="d-flex">
              <div className="file">
                <h4>File</h4>
                <p className="mb-1">
                  <i className="mr-2 far fa-file"></i>
                  <span className="ml-1 mb-1 remixui_text" onClick={() => createNewFile()}>New File</span>
                </p>
                <p className="mb-1">
                  <i className="mr-2 far fa-file-alt"></i>
                  <label className="ml-1 remixui_labelIt remixui_bigLabelSize} remixui_text">
                    Open Files
                    <input title="open file" type="file" onChange={(event) => {
                      event.stopPropagation()
                      uploadFile(event.target)
                    }} multiple />
                  </label>
                </p>
                <p className="mb-1">
                  <i className="mr-1 far fa-hdd"></i>
                  <span className="ml-1 remixui_text" onClick={() => connectToLocalhost()}>Connect to Localhost</span>
                </p>
                <p className="mt-3 mb-0"><label>LOAD FROM:</label></p>
                <div className="btn-group">
                  <button className="btn mr-1 btn-secondary" data-id="landingPageImportFromGistButton" onClick={() => importFromGist()}>Gist</button>
                  <button className="btn mx-1 btn-secondary" onClick={() => showFullMessage('Github', 'github URL', ['https://github.com/0xcert/ethereum-erc721/src/contracts/tokens/nf-token-metadata.sol', 'https://github.com/OpenZeppelin/openzeppelin-solidity/blob/67bca857eedf99bf44a4b6a0fc5b5ed553135316/contracts/access/Roles.sol'])}>GitHub</button>
                  <button className="btn mx-1 btn-secondary" onClick={() => showFullMessage('Ipfs', 'ipfs URL', ['ipfs://<ipfs-hash>'])}>Ipfs</button>
                  <button className="btn mx-1 btn-secondary" onClick={() => showFullMessage('Https', 'http/https raw content', ['https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol'])}>https</button>
                </div>
              </div>
              <div className="ml-4 pl-4">
                <h4>Resources</h4>
                <p className="mb-1">
                  <i className="mr-2 fas fa-book"></i>
                  <a className="remixui_text" target="__blank" href="https://remix-ide.readthedocs.io/en/latest/#">Documentation</a>
                </p>
                <p className="mb-1">
                  <i className="mr-2 fab fa-gitter"></i>
                  <a className="remixui_text" target="__blank" href="https://gitter.im/ethereum/remix">Gitter channel</a>
                </p>
                <p className="mb-1">
                  <img id='remixHhomeWebsite' className="mr-2 remixui_image" src={ plugin.profile.icon } style={ { filter: state.themeQuality.filter } } alt=''></img>
                  <a className="remixui_text" target="__blank" href="https://remix-project.org">Featuring website</a>
                </p>
                <p className="mb-1">
                  <i className="mr-2 fab fa-ethereum remixui_image"></i>
                  <span className="remixui_text" onClick={() => switchToPreviousVersion()}>Old experience</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex flex-column remixui_rightPanel">
          <div className="d-flex pr-3 py-2 align-self-end" id="remixIDEMediaPanelsTitle">
            <button
              className="btn-info p-2 m-1 border rounded-circle remixui_mediaBadge fab fa-twitter"
              id="remixIDEHomeTwitterbtn"
              title="Twitter"
              onClick={(e) => {
                setState(prevState => {
                  return { ...prevState, showMediaPanel: state.showMediaPanel === 'twitter' ? 'none' : 'twitter' }
                })
                _paq.push(['trackEvent', 'pluginManager', 'media', 'twitter'])
              }}
            ></button>
            <button
              className="btn-danger p-2 m-1 border rounded-circle remixui_mediaBadge fab fa-medium"
              id="remixIDEHomeMediumbtn"
              title="Medium blogs"
              onClick={(e) => {
                setState(prevState => {
                  return { ...prevState, showMediaPanel: state.showMediaPanel === 'medium' ? 'none' : 'medium' }
                })
                _paq.push(['trackEvent', 'pluginManager', 'media', 'medium'])
              }}
            ></button>
          </div>
          <div className="mr-3 d-flex bg-light remixui_panels" id="remixIDEMediaPanels">
            { (state.showMediaPanel === 'medium') && <div id="remixIDE_MediumBlock" className="p-2 mx-0 mb-0 remixui_remixHomeMedia" style={ { maxHeight: maxHeight } }>
              <div id="medium-widget" className="p-3 remixui_media" style={ { maxHeight: elHeight } }>
                <Mediumfeed userName="remix-ide" postN="6"/>
              </div>
            </div> }
            { (state.showMediaPanel === 'twitter') && <div id="remixIDE_TwitterBlock" className="p-2 mx-0 mb-0 remixui_remixHomeMedia" style={ { maxHeight: maxHeight } } >
              <div className="px-2 remixui_media" style={ { minHeight: elHeight } } >
                <TwitterTimelineEmbed
                  sourceType="profile"
                  screenName="EthereumRemix"
                  options={{ tweetLimit: 18, width: 350 }}
                  transparent={true}
                  noHeader={true}
                  noFooter={true}
                  theme={ state.themeQuality.name }
                />
              </div>
            </div>}
          </div>
        </div>
      </div>
    </>
  )
}

export default RemixUiHomeTab
