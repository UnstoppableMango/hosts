package hosts

import (
	"context"

	"github.com/pulumi/pulumi/pkg/v3/backend/display"
	"github.com/pulumi/pulumi/pkg/v3/engine"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optpreview"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/apitype"
	"github.com/pulumi/pulumi/sdk/v3/go/common/diag/colors"
	"github.com/pulumi/pulumi/sdk/v3/go/common/tokens"
)

type Host interface {
	Display(apitype.UpdateKind)
	Down(context.Context) error
	Preview(context.Context) error
	Up(context.Context) error
}

type HostOpts struct {
	WorkspaceOptions
	stack auto.Stack
}

func NewHost(ctx context.Context, name string, opts *HostOpts) (Host, error) {
	log := opts.Logger.WithGroup(name)
	workspace := opts.pulumi

	log.Info("Selecting stack", "stack", name)
	stack, err := auto.SelectStack(ctx, name, workspace)
	if err != nil {
		return nil, err
	}

	opts.stack = stack

	return opts, nil
}

func (h *HostOpts) Display(action apitype.UpdateKind) {
	done := make(chan bool)
	events := make(chan engine.Event)

	var packageName tokens.PackageName = "hosts"
	stackName := tokens.MustParseStackName(h.stack.Name())

	go func() {
		for e := range h.eventStream {
			event, err := display.ConvertJSONEvent(e.EngineEvent)
			if err != nil {
				h.Logger.Error("error converting event", "err", err)
				continue
			}

			events <- event
		}
	}()

	display.ShowEvents("op", action,
		stackName, packageName, "permalink",
		events, done,
		display.Options{
			Color: colors.Always,
		},
		true)

	<-done
}

// Down implements Host.
func (h *HostOpts) Down(ctx context.Context) error {
	h.Logger.Debug("Destroying stack")
	_, err := h.stack.Destroy(ctx,
		colors.Destroy,
		optdestroy.EventStreams(h.eventStream),
	)
	if err != nil {
		return err
	}

	return nil
}

// Preview implements Host.
func (h *HostOpts) Preview(ctx context.Context) error {
	h.Logger.Debug("Previewing stack")
	_, err := h.stack.Preview(ctx,
		colors.Preview,
		optpreview.EventStreams(h.eventStream),
	)
	if err != nil {
		return err
	}

	return nil
}

// Up implements Host.
func (h *HostOpts) Up(ctx context.Context) error {
	h.Logger.Debug("Updating stack")
	_, err := h.stack.Up(ctx,
		colors.Up,
		optup.EventStreams(h.eventStream),
	)
	if err != nil {
		return err
	}

	return nil
}
