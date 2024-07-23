package hosts

import (
	"context"
	"log/slog"
	"os"
	"path"
	"strings"

	"github.com/blang/semver"
	"github.com/pulumi/pulumi/pkg/v3/backend/display"
	"github.com/pulumi/pulumi/pkg/v3/engine"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
	"github.com/pulumi/pulumi/sdk/v3/go/auto/events"
	"github.com/pulumi/pulumi/sdk/v3/go/common/apitype"
	"github.com/pulumi/pulumi/sdk/v3/go/common/diag/colors"
	"github.com/pulumi/pulumi/sdk/v3/go/common/tokens"
)

type Workspace interface {
	Display(apitype.UpdateKind)
	GetHost(context.Context, string) (Host, error)
}

type WorkspaceOptions struct {
	pulumi      auto.Workspace
	Root        string
	Logger      *slog.Logger
	eventStream chan events.EngineEvent
}

func NewWorkspace(ctx context.Context, opts *WorkspaceOptions) (Workspace, error) {
	root := opts.Root
	log := opts.Logger

	log.Debug("Reading pulumi version")
	versionFile := path.Join(root, ".versions", "pulumi")
	versionBytes, err := os.ReadFile(versionFile)
	if err != nil {
		return nil, err
	}

	version := strings.TrimSpace(string(versionBytes))
	log.Debug("Pulumi version", "version", version)

	binDir := path.Join(root, "bin", "pulumi")
	log.Debug("Install pulumi command", "binDir", binDir)
	installPulumi, err := auto.InstallPulumiCommand(ctx, &auto.PulumiCommandOptions{
		Version: semver.MustParse(version),
		Root:    binDir,
	})
	if err != nil {
		return nil, err
	}

	programPath := path.Join(root, "packages", "hosts")
	// installDeps, err := auto.NewPulumiCommand(&auto.PulumiCommandOptions{
	// 	Version: semver.MustParse(version),
	// 	Root:    "",
	// })
	// if err != nil {
	// 	return err
	// }

	log.Debug("Creating workspace/installing", "programPath", programPath)
	work, err := auto.NewLocalWorkspace(ctx,
		auto.WorkDir(programPath),
		auto.Pulumi(installPulumi),
	)
	if err != nil {
		return nil, err
	}

	opts.pulumi = work
	opts.eventStream = make(chan events.EngineEvent)

	return opts, nil
}

// GetHost implements Workspace.
func (w *WorkspaceOptions) GetHost(ctx context.Context, name string) (Host, error) {
	w.Logger.Debug("Creating host")
	return NewHost(ctx, name, &HostOpts{WorkspaceOptions: *w})
}

func (w *WorkspaceOptions) Display(action apitype.UpdateKind) {
	done := make(chan bool)
	events := make(chan engine.Event)

	var packageName tokens.PackageName = "hosts"
	stackName := tokens.MustParseStackName("hosts")

	go func() {
		for e := range w.eventStream {
			event, err := display.ConvertJSONEvent(e.EngineEvent)
			if err != nil {
				w.Logger.Error("error converting event", "err", err)
				continue
			}

			events <- event
		}
	}()

	display.ShowEvents("previewing", action,
		stackName, packageName, "",
		events, done,
		display.Options{
			Color:             colors.Always,
			ShowConfig:        false,
			ShowSameResources: false,
		},
		true)

	<-done
}
