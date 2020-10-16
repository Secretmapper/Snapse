export function hasClass(orig: string, className: string) {
  return !!orig.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

export function addClass(orig: string, className: string) {
  if (!hasClass(orig, className)) {
    return orig + ' ' + className
  }
  return orig
}

export function removeClass(orig: string, className: string) {
  if (hasClass(orig, className)) {
    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
    return orig.replace(reg, ' ')
  }
  return orig
}

export default {
  has: hasClass,
  add: addClass,
  remove: removeClass
}
