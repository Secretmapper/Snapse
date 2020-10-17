import { initialize, neurons, step, stepBack } from './index'

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

xtest('step generates prev state', () => {
  const s_3 = states[3]
  const s_2 = stepBack(neurons, s_3)
  const s_1 = stepBack(neurons, s_2)
  const s_0 = stepBack(neurons, s_1)

  expect(s_3).toEqual(states[3])
  expect(s_2).toEqual(states[2])
  expect(s_1).toEqual(states[1])
  expect(s_0).toEqual(states[0])
})
