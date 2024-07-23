package hosts

import (
	"context"
	"io"
	"os"

	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optpreview"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
)

type Host interface {
	io.Closer
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

// Down implements Host.
func (h *HostOpts) Down(ctx context.Context) error {
	h.Logger.Info("Destroying stack")
	_, err := h.stack.Destroy(ctx,
		optdestroy.ProgressStreams(os.Stdout),
	)
	if err != nil {
		return err
	}

	return nil
}

// Preview implements Host.
func (h *HostOpts) Preview(ctx context.Context) error {
	h.Logger.Info("Previewing stack")
	_, err := h.stack.Preview(ctx,
		optpreview.ProgressStreams(os.Stdout),
	)
	if err != nil {
		return err
	}

	return nil
}

// Up implements Host.
func (h *HostOpts) Up(ctx context.Context) error {
	h.Logger.Info("Updating stack")
	_, err := h.stack.Up(ctx,
		optup.ProgressStreams(os.Stdout),
	)
	if err != nil {
		return err
	}

	return nil
}

// Close implements Host.
func (h *HostOpts) Close() error {
	// h.log.Info("Removing working directory")
	// return os.Remove(h.path)
	return nil
}
