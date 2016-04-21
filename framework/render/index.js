function render (renderHtmlPath, bindFn) {
  return function (WrappedComponent) {
    WrappedComponent.__renderPage = renderHtmlPath
    if (bindFn != null && typeof bindFn !== 'undefined') {
      WrappedComponent.__renderBindFn = bindFn
    }
    return WrappedComponent
  }
}

export default {
  render: render
}
