package hosts

import (
	"context"
	"os"

	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optpreview"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
)

type Host interface {
	Down(context.Context) error
	Preview(context.Context) error
	Up(context.Context) error
	Cancel(context.Context) error
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

// Down implements Host.
func (h *HostOpts) Down(ctx context.Context) error {
	h.Logger.Debug("Destroying stack")
	_, err := h.stack.Destroy(ctx,
		colors.Destroy,
		optdestroy.ProgressStreams(os.Stdout),
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
		optpreview.ProgressStreams(os.Stdout),
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
		optup.ProgressStreams(os.Stdout),
	)
	if err != nil {
		return err
	}

	return nil
}

func (h *HostOpts) Cancel(ctx context.Context) error {
	return h.stack.Cancel(ctx)
}
