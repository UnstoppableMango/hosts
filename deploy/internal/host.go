package hosts

import (
	"context"

	"github.com/pulumi/pulumi/pkg/v3/backend/display"
	"github.com/pulumi/pulumi/pkg/v3/engine"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/events"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optpreview"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/optup"
	"github.com/pulumi/pulumi/sdk/v3/go/common/apitype"
	"github.com/pulumi/pulumi/sdk/v3/go/common/diag/colors"
	"github.com/pulumi/pulumi/sdk/v3/go/common/tokens"
	"github.com/unstoppablemango/hosts/deploy/internal/channel"
)

type Host interface {
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
	events := make(chan events.EngineEvent)
	log := h.Logger.With("name", h.stack.Name())

	log.Debug("Destroying stack")
	res, err := h.stack.Destroy(ctx,
		optdestroy.EventStreams(events),
	)
	if err != nil {
		return err
	}

	log.Debug("Getting permalink")
	permalink, err := res.GetPermalink()
	if err != nil {
		return err
	}

	log.Debug("Printing events")
	h.print(apitype.DestroyUpdate, permalink, events)

	return nil
}

// Preview implements Host.
func (h *HostOpts) Preview(ctx context.Context) error {
	events := make(chan events.EngineEvent)
	log := h.Logger.With("name", h.stack.Name())

	log.Debug("Previewing stack")
	res, err := h.stack.Preview(ctx,
		optpreview.EventStreams(events),
	)
	if err != nil {
		return err
	}

	log.Debug("Getting permalink")
	permalink, err := res.GetPermalink()
	if err != nil {
		return err
	}

	log.Debug("Printing events")
	h.print(apitype.PreviewUpdate, permalink, events)

	return nil
}

// Up implements Host.
func (h *HostOpts) Up(ctx context.Context) error {
	events := make(chan events.EngineEvent)
	log := h.Logger.With("name", h.stack.Name())

	log.Debug("Updating stack")
	res, err := h.stack.Up(ctx,
		optup.EventStreams(events),
	)
	if err != nil {
		return err
	}

	log.Debug("Getting permalink")
	permalink, err := res.GetPermalink()
	if err != nil {
		return err
	}

	log.Debug("Printing events")
	h.print(apitype.UpdateUpdate, permalink, events)

	return nil
}

func (h *HostOpts) stackName() string {
	return h.stack.Name()
}

func (h *HostOpts) print(
	action apitype.UpdateKind,
	permalink string,
	stream <-chan events.EngineEvent,
) {
	done := make(chan bool)

	var packageName tokens.PackageName = "hosts"
	stackName := tokens.MustParseStackName(h.stackName())

	h.Logger.Debug("Mapping events")
	buffer := channel.Map(stream, func(e events.EngineEvent) engine.Event {
		h.Logger.Debug("Converting event")
		event, err := display.ConvertJSONEvent(e.EngineEvent)
		if err != nil {
			panic(err)
		}

		return event
	})

	var op string
	switch action {
	case apitype.PreviewUpdate:
		op = "previewing"
	case apitype.UpdateUpdate:
		op = "updating"
	case apitype.DestroyUpdate:
		op = "destroying"
	}

	go display.ShowEvents(op, action,
		stackName, packageName, permalink,
		buffer, done,
		display.Options{
			Color:               colors.Always,
			ShowConfig:          false,
			ShowSameResources:   false,
			DeterministicOutput: true,
		},
		true)

	<-done
}
