import React from 'react';
import userEvent from '@testing-library/user-event';
import sinon from 'sinon';
import FormSteps, {
  getStepIndexByName,
} from '@18f/identity-document-capture/components/form-steps';
import render from '../../../support/render';

describe('document-capture/components/form-steps', () => {
  const STEPS = [
    { name: 'first', title: 'First Title', form: () => <span>First</span> },
    {
      name: 'second',
      title: 'Second Title',
      form: ({ value = {}, onChange, registerField }) => (
        // eslint-disable-next-line jsx-a11y/label-has-associated-control
        <label>
          Second
          <input
            ref={registerField('second', { isRequired: true })}
            value={value.second || ''}
            onChange={(event) => {
              onChange({ changed: true });
              onChange({ second: event.target.value });
            }}
          />
        </label>
      ),
    },
    { name: 'last', title: 'Last Title', form: () => <span>Last</span> },
  ];

  let originalHash;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  describe('getStepIndexByName', () => {
    it('returns -1 if no step by name', () => {
      const result = getStepIndexByName(STEPS, 'third');

      expect(result).to.be.equal(-1);
    });

    it('returns index of step by name', () => {
      const result = getStepIndexByName(STEPS, 'second');

      expect(result).to.be.equal(1);
    });
  });

  it('renders nothing if given empty steps array', () => {
    const { container } = render(<FormSteps steps={[]} />);

    expect(container.childNodes).to.have.lengthOf(0);
  });

  it('renders the first step initially', () => {
    const { getByText } = render(<FormSteps steps={STEPS} />);

    expect(getByText('First')).to.be.ok();
  });

  it('renders continue button at first step', () => {
    const { getByText } = render(<FormSteps steps={STEPS} />);

    expect(getByText('forms.buttons.continue')).to.be.ok();
  });

  it('renders the active step', () => {
    const { getByText } = render(<FormSteps steps={STEPS} />);

    userEvent.click(getByText('forms.buttons.continue'));

    expect(getByText('Second')).to.be.ok();
  });

  it('renders continue button until at last step', () => {
    const { getByText } = render(<FormSteps steps={STEPS} />);

    userEvent.click(getByText('forms.buttons.continue'));

    expect(getByText('forms.buttons.continue')).to.be.ok();
  });

  it('renders submit button at last step', () => {
    const { getByText, getByRole } = render(<FormSteps steps={STEPS} />);

    userEvent.click(getByText('forms.buttons.continue'));
    userEvent.type(getByRole('textbox'), 'val');
    userEvent.click(getByText('forms.buttons.continue'));

    expect(getByText('forms.buttons.submit.default')).to.be.ok();
  });

  it('submits with form values', () => {
    const onComplete = sinon.spy();
    const { getByText, getByRole } = render(<FormSteps steps={STEPS} onComplete={onComplete} />);

    userEvent.click(getByText('forms.buttons.continue'));
    userEvent.type(getByRole('textbox'), 'val');
    userEvent.click(getByText('forms.buttons.continue'));
    userEvent.click(getByText('forms.buttons.submit.default'));

    expect(onComplete.getCall(0).args[0]).to.eql({
      second: 'val',
      changed: true,
    });
  });

  it('pushes step to URL', () => {
    const { getByText } = render(<FormSteps steps={STEPS} />);

    expect(window.location.hash).to.equal('');

    userEvent.click(getByText('forms.buttons.continue'));

    expect(window.location.hash).to.equal('#step=second');
  });

  it('syncs step by history events', async () => {
    const { getByText, findByText, getByRole } = render(<FormSteps steps={STEPS} />);

    userEvent.click(getByText('forms.buttons.continue'));
    userEvent.type(getByRole('textbox'), 'val');

    window.history.back();

    expect(await findByText('First')).to.be.ok();
    expect(window.location.hash).to.equal('');

    window.history.forward();

    expect(await findByText('Second')).to.be.ok();
    expect(getByRole('textbox').value).to.equal('val');
    expect(window.location.hash).to.equal('#step=second');
  });

  it('clear URL parameter after submission', (done) => {
    const onComplete = sinon.spy(() => {
      expect(window.location.hash).to.equal('');

      done();
    });
    const { getByText, getByRole } = render(<FormSteps steps={STEPS} onComplete={onComplete} />);

    userEvent.click(getByText('forms.buttons.continue'));
    userEvent.type(getByRole('textbox'), 'val');
    userEvent.click(getByText('forms.buttons.continue'));
    userEvent.click(getByText('forms.buttons.submit.default'));
  });

  it('shifts focus to next heading on step change', () => {
    const { getByText } = render(<FormSteps steps={STEPS} />);

    userEvent.click(getByText('forms.buttons.continue'));

    expect(document.activeElement).to.equal(getByText('Second Title'));
  });

  it("doesn't assign focus on mount", () => {
    const { activeElement: originalActiveElement } = document;
    render(<FormSteps steps={STEPS} />);
    expect(document.activeElement).to.equal(originalActiveElement);
  });

  it('resets to first step at mount', () => {
    window.location.hash = '#step=last';

    render(<FormSteps steps={STEPS} />);

    expect(window.location.hash).to.equal('');
  });

  it('optionally auto-focuses', () => {
    const { getByText } = render(<FormSteps steps={STEPS} autoFocus />);

    expect(document.activeElement).to.equal(getByText('First Title'));
  });

  it('accepts initial values', () => {
    const { getByText, getByLabelText } = render(
      <FormSteps steps={STEPS} initialValues={{ second: 'prefilled' }} />,
    );

    userEvent.click(getByText('forms.buttons.continue'));
    const input = getByLabelText('Second');

    expect(input.value).to.equal('prefilled');
  });

  it('prevents submission if step is invalid', () => {
    const { getByText, getByLabelText } = render(<FormSteps steps={STEPS} />);

    userEvent.click(getByText('forms.buttons.continue'));
    userEvent.click(getByText('forms.buttons.continue'));

    expect(window.location.hash).to.equal('#step=second');
    expect(document.activeElement).to.equal(getByLabelText('Second'));
  });

  it('renders with optional footer', () => {
    const steps = [
      {
        name: 'one',
        title: 'Step One',
        form: () => <span>Form Fields</span>,
        footer: () => <span>Footer</span>,
      },
    ];
    const { getByText } = render(<FormSteps steps={steps} />);

    expect(getByText('Footer')).to.be.ok();
  });
});
