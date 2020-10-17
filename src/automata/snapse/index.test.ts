import { initialize, NeuronsMap, parseRule, step, stepBack } from './index'

export const neurons: NeuronsMap = {
  q0: {
    id: 'q0',
    spikes: 2,
    rules: ['a/a->a;1'],
    out: ['q1'],
    position: { x: 250, y: 250 },
    isOutput: false
  },
  q1: {
    id: 'q1',
    spikes: 2,
    rules: ['aa/aa->a;2'],
    out: ['q2'],
    position: { x: 400, y: 250 },
    isOutput: false
  },
  q2: {
    id: 'q2',
    spikes: 2,
    isOutput: true,
    position: { x: 600, y: 250 }
  }
}

const states = [
  {
    q0: {
      spikes: 2,
      delay: 0
    },
    q1: {
      spikes: 2,
      delay: 0
    },
    q2: {
      spikes: 2,
      delay: 0
    }
  },
  {
    q0: {
      spikes: 2,
      delay: 0
    },
    q1: {
      spikes: 2,
      delay: 2,
      rule: 'aa/aa->a;2'
    },
    q2: {
      bitstring: '0',
      spikes: 2,
      delay: 0
    }
  },
  {
    q0: {
      spikes: 2,
      delay: 0
    },
    q1: {
      spikes: 2,
      delay: 1,
      rule: 'aa/aa->a;2'
    },
    q2: {
      bitstring: '00',
      spikes: 2,
      delay: 0
    }
  },
  {
    q0: {
      spikes: 2,
      delay: 0
    },
    q1: {
      justResolvedRule: 'aa/aa->a;2',
      spikes: 0,
      delay: 0
    },
    q2: {
      bitstring: '001',
      spikes: 3,
      delay: 0
    }
  }
]

test('matches proper rules', () => {
  expect(parseRule('a/a->a;1')).toEqual([1, 1, 1, 1])
  expect(parseRule('aa/a->a;1')).toEqual([2, 1, 1, 1])
  expect(parseRule('a/aa->a;1')).toEqual([1, 2, 1, 1])
  expect(parseRule('a/a->aa;1')).toEqual([1, 1, 2, 1])
  expect(parseRule('a/a->a;2')).toEqual([1, 1, 1, 2])
  expect(parseRule('a/a->a;20')).toEqual([1, 1, 1, 20])

  expect(parseRule('/a->a;20')).toEqual(false)
  expect(parseRule('a/->a;20')).toEqual(false)
  expect(parseRule('a/a->;20')).toEqual(false)
  expect(parseRule('a/a->;')).toEqual(false)
  expect(parseRule('a///a->;5')).toEqual(false)
  expect(parseRule('')).toEqual(false)
})

test('creates initial state', () => {
  const init = initialize(neurons)
  expect(init).toEqual(states[0])
})

test('step generates next state', () => {
  const s_0 = initialize(neurons)
  const s_1 = step(neurons, s_0)
  const s_2 = step(neurons, s_1)
  const s_3 = step(neurons, s_2)

  expect(s_0).toEqual(states[0])
  expect(s_1).toEqual(states[1])
  expect(s_2).toEqual(states[2])
  expect(s_3).toEqual(states[3])
})

xdescribe('step', () => {
  describe('neuron', () => {
    describe('when locked', () => {
      test('does not receive spike', () => {})
    })
    describe('on rule resolution', () => {
      test('produces spike to output', () => {})
      test('consumes spike', () => {})
    })
  })
  describe('output', () => {
    describe('on timestep', () => {
      test('adds 0 to output', () => {})
    })
    describe('on n spike receipt', () => {
      test('adds n to output', () => {})
    })
  })
})

xtest('stepBack generates prev state', () => {
  const s_3 = states[3]
  const s_2 = stepBack(neurons, s_3)
  const s_1 = stepBack(neurons, s_2)
  const s_0 = stepBack(neurons, s_1)

  expect(s_3).toEqual(states[3])
  expect(s_2).toEqual(states[2])
  expect(s_1).toEqual(states[1])
  expect(s_0).toEqual(states[0])
})
